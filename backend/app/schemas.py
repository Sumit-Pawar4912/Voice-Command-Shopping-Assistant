"""
Pydantic schemas used for request validation and response serialization.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Shopping item schemas
# ---------------------------------------------------------------------------

class ShoppingItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    quantity: int = Field(default=1, ge=1)
    category: str = Field(default="General", max_length=100)
    brand: str | None = Field(default=None, max_length=100)
    price: float | None = Field(default=None, ge=0)


class ShoppingItemCreate(ShoppingItemBase):
    """Payload for creating a new shopping item."""


class ShoppingItemUpdate(BaseModel):
    """Payload for partially updating an existing shopping item."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    quantity: int | None = Field(default=None, ge=1)
    category: str | None = Field(default=None, max_length=100)
    brand: str | None = None
    price: float | None = Field(default=None, ge=0)


class ShoppingItemOut(ShoppingItemBase):
    id: int
    purchase_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Voice command processing schemas
# ---------------------------------------------------------------------------

class CommandRequest(BaseModel):
    """Raw text recognized by the browser's Web Speech API."""

    text: str = Field(..., min_length=1, max_length=500)
    language: str = Field(default="en", description="BCP-47 language code, e.g. en, hi, mr")


class CommandResult(BaseModel):
    """
    Structured result returned to the frontend after a voice command has been
    interpreted by Gemini and applied to the database.
    """

    action: Literal["add", "remove", "update", "search", "clear", "unknown"]
    item: str | None = None
    quantity: int | None = None
    category: str | None = None
    brand: str | None = None
    max_price: float | None = None
    message: str
    success: bool = True
    data: list[ShoppingItemOut] | None = None


# ---------------------------------------------------------------------------
# Recommendation schemas
# ---------------------------------------------------------------------------

class SubstituteSuggestion(BaseModel):
    item: str
    substitutes: list[str]


class RecommendationsOut(BaseModel):
    frequent: list[str]
    seasonal: list[str]
    substitutes: list[SubstituteSuggestion]


# ---------------------------------------------------------------------------
# Product catalog / search schemas
# ---------------------------------------------------------------------------

class ProductOut(BaseModel):
    name: str
    category: str
    brand: str
    price: float
    available: bool
    organic: bool
    size: str
