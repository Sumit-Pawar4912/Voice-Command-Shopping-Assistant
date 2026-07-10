"""
API route definitions for the Voice Command Shopping Assistant.
"""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud
from app.ai_service import interpret_command
from app.database import get_db
from app.schemas import (
    CommandRequest,
    CommandResult,
    ProductOut,
    RecommendationsOut,
    ShoppingItemCreate,
    ShoppingItemOut,
    ShoppingItemUpdate,
    SubstituteSuggestion,
)
from app.utils import get_seasonal_suggestions, get_substitutes, infer_category, search_products

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Voice command processing
# ---------------------------------------------------------------------------

@router.post("/process-command", response_model=CommandResult, tags=["Voice Commands"])
async def process_command(payload: CommandRequest, db: Session = Depends(get_db)):
    """
    Take raw recognized speech text, interpret it via Gemini (or the
    rule-based fallback), apply the resulting action to the shopping list,
    and return a structured result for the frontend to display.
    """
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Empty voice input received.")

    try:
        parsed = await interpret_command(payload.text, payload.language)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unexpected NLU failure")
        raise HTTPException(status_code=502, detail="Could not understand the command.") from exc

    action = parsed.get("action", "unknown")
    item_name = (parsed.get("item") or "").strip()
    quantity = parsed.get("quantity")
    category = parsed.get("category")
    brand = parsed.get("brand")
    max_price = parsed.get("max_price")

    result = CommandResult(
        action=action, item=item_name or None, quantity=quantity, category=category,
        brand=brand, max_price=max_price, message="", success=True,
    )

    try:
        if action == "add":
            if not item_name:
                result.success = False
                result.message = "I couldn't figure out which item to add."
            else:
                item_in = ShoppingItemCreate(
                    name=item_name, quantity=quantity or 1,
                    category=category or infer_category(item_name), brand=brand,
                )
                db_item = crud.create_item(db, item_in)
                result.message = f"Added {db_item.quantity} x {db_item.name} to your list."
                result.data = [ShoppingItemOut.model_validate(db_item)]

        elif action == "remove":
            if not item_name:
                result.success = False
                result.message = "I couldn't figure out which item to remove."
            else:
                deleted = crud.delete_item_by_name(db, item_name)
                result.success = deleted
                result.message = (
                    f"Removed {item_name} from your list." if deleted
                    else f"{item_name} was not found on your list."
                )

        elif action == "update":
            if not item_name:
                result.success = False
                result.message = "I couldn't figure out which item to update."
            else:
                updated = crud.update_item_by_name(db, item_name, quantity=quantity)
                if updated:
                    result.message = f"Updated {updated.name} to quantity {updated.quantity}."
                    result.data = [ShoppingItemOut.model_validate(updated)]
                else:
                    result.success = False
                    result.message = f"{item_name} was not found on your list."

        elif action == "search":
            products = search_products(query=item_name or None, max_price=max_price)
            result.message = f"Found {len(products)} matching product(s)."

        elif action == "clear":
            count = crud.clear_items(db)
            result.message = f"Cleared {count} item(s) from your list."

        else:
            result.success = False
            result.message = "Sorry, I didn't understand that command. Please try again."

        crud.log_command(
            db, raw_text=payload.text, action=action, item_name=item_name or None,
            payload_json=json.dumps(parsed),
        )

    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to apply command to the database")
        raise HTTPException(status_code=500, detail="Database error while applying command.") from exc

    return result


# ---------------------------------------------------------------------------
# Shopping list CRUD
# ---------------------------------------------------------------------------

@router.get("/items", response_model=list[ShoppingItemOut], tags=["Shopping List"])
def list_items(db: Session = Depends(get_db)):
    """Return every item currently on the shopping list."""
    return crud.get_items(db)


@router.post("/items", response_model=ShoppingItemOut, status_code=201, tags=["Shopping List"])
def add_item(item: ShoppingItemCreate, db: Session = Depends(get_db)):
    """Manually add an item to the shopping list (non-voice path)."""
    return crud.create_item(db, item)


@router.put("/items/{item_id}", response_model=ShoppingItemOut, tags=["Shopping List"])
def edit_item(item_id: int, item: ShoppingItemUpdate, db: Session = Depends(get_db)):
    """Update an existing item by id."""
    updated = crud.update_item(db, item_id, item)
    if not updated:
        raise HTTPException(status_code=404, detail="Item not found.")
    return updated


@router.delete("/items/{item_id}", status_code=204, tags=["Shopping List"])
def remove_item(item_id: int, db: Session = Depends(get_db)):
    """Delete a single item by id."""
    if not crud.delete_item(db, item_id):
        raise HTTPException(status_code=404, detail="Item not found.")
    return None


@router.delete("/items", status_code=200, tags=["Shopping List"])
def clear_all_items(db: Session = Depends(get_db)):
    """Delete every item from the shopping list."""
    count = crud.clear_items(db)
    return {"message": f"Cleared {count} item(s).", "count": count}


# ---------------------------------------------------------------------------
# Recommendations
# ---------------------------------------------------------------------------

@router.get("/recommendations", response_model=RecommendationsOut, tags=["Recommendations"])
def get_recommendations(db: Session = Depends(get_db)):
    """Return frequent-purchase, seasonal, and substitute-product suggestions."""
    frequent = crud.get_frequent_items(db, limit=5)
    seasonal = get_seasonal_suggestions()

    substitutes = [
        SubstituteSuggestion(item=item.name, substitutes=get_substitutes(item.name))
        for item in crud.get_items(db)
        if get_substitutes(item.name)
    ]

    return RecommendationsOut(frequent=frequent, seasonal=seasonal, substitutes=substitutes)


# ---------------------------------------------------------------------------
# Product search
# ---------------------------------------------------------------------------

@router.get("/search", response_model=list[ProductOut], tags=["Search"])
def search(
    q: str | None = Query(default=None, description="Free text product name search"),
    brand: str | None = Query(default=None),
    category: str | None = Query(default=None),
    organic: bool | None = Query(default=None),
    max_price: float | None = Query(default=None, ge=0),
):
    """Search the mock product catalog by name, brand, category, organic flag, and price."""
    return search_products(query=q, brand=brand, category=category, organic=organic,
                            max_price=max_price)


# ---------------------------------------------------------------------------
# Command history (bonus: recent commands / undo)
# ---------------------------------------------------------------------------

@router.get("/history", tags=["History"])
def recent_commands(db: Session = Depends(get_db)):
    """Return the most recent voice commands processed."""
    history = crud.get_recent_commands(db, limit=10)
    return [
        {
            "id": h.id, "raw_text": h.raw_text, "action": h.action,
            "item_name": h.item_name, "created_at": h.created_at,
        }
        for h in history
    ]
