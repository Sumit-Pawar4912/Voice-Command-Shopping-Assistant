"""
CRUD (Create, Read, Update, Delete) operations for the shopping list.

This module is the ONLY place that talks to the database. Gemini never
touches the database directly - it only produces structured JSON which is
then interpreted and executed here.
"""

from collections import Counter

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import CommandHistory, ShoppingItem
from app.schemas import ShoppingItemCreate, ShoppingItemUpdate
from app.utils import infer_category


def get_items(db: Session) -> list[ShoppingItem]:
    """Return every item currently on the shopping list, most recent first."""
    return db.query(ShoppingItem).order_by(ShoppingItem.created_at.desc()).all()


def get_item_by_name(db: Session, name: str) -> ShoppingItem | None:
    """Case-insensitive lookup of an item by name."""
    return (
        db.query(ShoppingItem)
        .filter(func.lower(ShoppingItem.name) == name.lower().strip())
        .first()
    )


def get_item(db: Session, item_id: int) -> ShoppingItem | None:
    """Fetch a single item by its primary key."""
    return db.query(ShoppingItem).filter(ShoppingItem.id == item_id).first()


def create_item(db: Session, item_in: ShoppingItemCreate) -> ShoppingItem:
    """
    Add a new item to the shopping list. If an item with the same name already
    exists, its quantity is incremented instead of creating a duplicate row.
    """
    existing = get_item_by_name(db, item_in.name)
    if existing:
        existing.quantity += item_in.quantity
        existing.purchase_count += 1
        if item_in.brand:
            existing.brand = item_in.brand
        if item_in.price is not None:
            existing.price = item_in.price
        db.commit()
        db.refresh(existing)
        return existing

    category = item_in.category or infer_category(item_in.name)
    db_item = ShoppingItem(
        name=item_in.name.strip().title(),
        quantity=item_in.quantity,
        category=category,
        brand=item_in.brand,
        price=item_in.price,
        purchase_count=1,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def update_item(db: Session, item_id: int, item_in: ShoppingItemUpdate) -> ShoppingItem | None:
    """Apply a partial update to an existing item."""
    db_item = get_item(db, item_id)
    if not db_item:
        return None

    update_data = item_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_item, field, value)

    db.commit()
    db.refresh(db_item)
    return db_item


def update_item_by_name(db: Session, name: str, quantity: int | None = None,
                         category: str | None = None) -> ShoppingItem | None:
    """Update an item looked up by name - used by the voice-command pipeline."""
    db_item = get_item_by_name(db, name)
    if not db_item:
        return None
    if quantity is not None:
        db_item.quantity = quantity
    if category is not None:
        db_item.category = category
    db.commit()
    db.refresh(db_item)
    return db_item


def delete_item(db: Session, item_id: int) -> bool:
    """Delete a single item by id. Returns True if a row was deleted."""
    db_item = get_item(db, item_id)
    if not db_item:
        return False
    db.delete(db_item)
    db.commit()
    return True


def delete_item_by_name(db: Session, name: str) -> bool:
    """Delete a single item looked up by name - used by the voice-command pipeline."""
    db_item = get_item_by_name(db, name)
    if not db_item:
        return False
    db.delete(db_item)
    db.commit()
    return True


def clear_items(db: Session) -> int:
    """Delete every item on the shopping list. Returns the number of rows removed."""
    count = db.query(ShoppingItem).delete()
    db.commit()
    return count


# ---------------------------------------------------------------------------
# Recommendations
# ---------------------------------------------------------------------------

def get_frequent_items(db: Session, limit: int = 5) -> list[str]:
    """Return the names of the most frequently purchased items."""
    items = db.query(ShoppingItem).order_by(ShoppingItem.purchase_count.desc()).limit(limit).all()
    return [item.name for item in items]


def get_frequent_from_history(db: Session, limit: int = 5) -> list[str]:
    """Alternate frequency calculation based on the command history log."""
    rows = (
        db.query(CommandHistory.item_name)
        .filter(CommandHistory.action == "add", CommandHistory.item_name.isnot(None))
        .all()
    )
    counter = Counter(row[0] for row in rows if row[0])
    return [name for name, _ in counter.most_common(limit)]


# ---------------------------------------------------------------------------
# Command history (recent commands / undo)
# ---------------------------------------------------------------------------

def log_command(db: Session, raw_text: str, action: str, item_name: str | None,
                 payload_json: str | None) -> CommandHistory:
    """Persist a processed voice command for history/undo features."""
    entry = CommandHistory(
        raw_text=raw_text, action=action, item_name=item_name, payload_json=payload_json
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_recent_commands(db: Session, limit: int = 10) -> list[CommandHistory]:
    """Return the most recent voice commands, newest first."""
    return db.query(CommandHistory).order_by(CommandHistory.created_at.desc()).limit(limit).all()
