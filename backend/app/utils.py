"""
Utility data and helper functions:
- Automatic product categorization
- Mock product catalog (for search)
- Seasonal recommendation data
- Substitute product dictionary
"""

from datetime import datetime

# ---------------------------------------------------------------------------
# Category inference
# ---------------------------------------------------------------------------

CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "Dairy": ["milk", "cheese", "butter", "yogurt", "curd", "paneer", "cream"],
    "Produce": ["apple", "banana", "mango", "grape", "onion", "potato", "tomato",
                "vegetable", "fruit", "carrot", "spinach", "watermelon"],
    "Bakery": ["bread", "bun", "cake", "pastry", "bagel", "croissant"],
    "Grocery": ["rice", "flour", "atta", "dal", "lentil", "oil", "salt", "spice",
                "quinoa", "wheat"],
    "Snacks": ["chips", "biscuit", "cookie", "namkeen", "popcorn", "chocolate"],
    "Beverage": ["water", "juice", "soda", "coffee", "tea", "cola", "drink"],
    "Personal Care": ["toothpaste", "soap", "shampoo", "brush", "lotion"],
    "Household": ["detergent", "cleaner", "tissue", "bulb", "blanket"],
}


def infer_category(item_name: str) -> str:
    """Infer a product category from its name using simple keyword matching."""
    name_lower = item_name.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in name_lower for keyword in keywords):
            return category
    return "General"


# ---------------------------------------------------------------------------
# Seasonal recommendations
# ---------------------------------------------------------------------------

SEASONAL_ITEMS: dict[str, list[str]] = {
    "summer": ["Mango", "Juice", "Ice Cream", "Watermelon"],
    "monsoon": ["Umbrella", "Tea", "Pakoda Mix", "Raincoat"],
    "winter": ["Soup", "Tea", "Coffee", "Blanket"],
}


def get_current_season() -> str:
    """Return a season name based on the current month (Northern-hemisphere / India climate)."""
    month = datetime.utcnow().month
    if month in (3, 4, 5, 6):
        return "summer"
    if month in (7, 8, 9):
        return "monsoon"
    return "winter"


def get_seasonal_suggestions() -> list[str]:
    """Return suggested items for the current season."""
    return SEASONAL_ITEMS.get(get_current_season(), [])


# ---------------------------------------------------------------------------
# Substitute product dictionary
# ---------------------------------------------------------------------------

SUBSTITUTES: dict[str, list[str]] = {
    "milk": ["Almond Milk", "Soy Milk", "Oat Milk"],
    "sugar": ["Brown Sugar", "Jaggery"],
    "rice": ["Brown Rice", "Quinoa"],
    "butter": ["Margarine", "Ghee"],
    "wheat flour": ["Multigrain Flour", "Almond Flour"],
}


def get_substitutes(item_name: str) -> list[str]:
    """Return substitute product suggestions for a given item, if any are known."""
    return SUBSTITUTES.get(item_name.lower().strip(), [])


# ---------------------------------------------------------------------------
# Mock product catalog (used for the /search endpoint)
# ---------------------------------------------------------------------------

PRODUCT_CATALOG: list[dict] = [
    {"name": "Colgate Total Toothpaste", "category": "Personal Care", "brand": "Colgate",
     "price": 120.0, "available": True, "organic": False, "size": "150g"},
    {"name": "Colgate Herbal Toothpaste", "category": "Personal Care", "brand": "Colgate",
     "price": 95.0, "available": True, "organic": True, "size": "100g"},
    {"name": "Amul Milk", "category": "Dairy", "brand": "Amul",
     "price": 60.0, "available": True, "organic": False, "size": "1L"},
    {"name": "Organic A2 Milk", "category": "Dairy", "brand": "Sid's Farm",
     "price": 110.0, "available": True, "organic": True, "size": "1L"},
    {"name": "Organic Apples", "category": "Produce", "brand": "Nature's Basket",
     "price": 220.0, "available": True, "organic": True, "size": "1kg"},
    {"name": "Regular Apples", "category": "Produce", "brand": "Local",
     "price": 150.0, "available": True, "organic": False, "size": "1kg"},
    {"name": "India Gate Basmati Rice", "category": "Grocery", "brand": "India Gate",
     "price": 180.0, "available": True, "organic": False, "size": "5kg"},
    {"name": "Organic Brown Rice", "category": "Grocery", "brand": "24 Mantra",
     "price": 210.0, "available": True, "organic": True, "size": "1kg"},
    {"name": "Britannia Bread", "category": "Bakery", "brand": "Britannia",
     "price": 45.0, "available": True, "organic": False, "size": "400g"},
    {"name": "Lays Chips", "category": "Snacks", "brand": "Lays",
     "price": 20.0, "available": True, "organic": False, "size": "52g"},
    {"name": "Bisleri Water", "category": "Beverage", "brand": "Bisleri",
     "price": 20.0, "available": True, "organic": False, "size": "1L"},
    {"name": "Tata Tea Gold", "category": "Beverage", "brand": "Tata",
     "price": 140.0, "available": True, "organic": False, "size": "500g"},
]


def search_products(
    query: str | None = None,
    brand: str | None = None,
    category: str | None = None,
    organic: bool | None = None,
    max_price: float | None = None,
) -> list[dict]:
    """Filter the mock product catalog based on the provided search criteria."""
    results = PRODUCT_CATALOG

    if query:
        q = query.lower()
        results = [p for p in results if q in p["name"].lower()]
    if brand:
        b = brand.lower()
        results = [p for p in results if b in p["brand"].lower()]
    if category:
        c = category.lower()
        results = [p for p in results if c in p["category"].lower()]
    if organic is not None:
        results = [p for p in results if p["organic"] == organic]
    if max_price is not None:
        results = [p for p in results if p["price"] <= max_price]

    return results
