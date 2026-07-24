"""
Gemini-powered natural language understanding service.

Gemini is used STRICTLY for converting free-form natural language (in
English, Hindi, or Marathi) into a small, structured JSON object describing
what the user wants to do. Gemini never touches the database - all
persistence happens in crud.py after this module has produced clean,
validated JSON.

Uses Google's current unified `google-genai` SDK (the older
`google-generativeai` package is deprecated/EOL).
"""

import json
import logging
import re

from google import genai

from app.config import settings

logger = logging.getLogger(__name__)

_client = None
if settings.gemini_api_key:
    _client = genai.Client(api_key=settings.gemini_api_key)

# Use a current, stable model. "gemini-2.5-flash" is the fast/cost-efficient
# workhorse model as of 2026. If this ever 404s again, run:
#   from google import genai; c = genai.Client(api_key="...")
#   for m in c.models.list(): print(m.name)
# and swap in whatever current model name is returned.
MODEL_NAME = "gemini-2.5-flash"

# The system prompt instructs Gemini to act purely as an NLU layer and to
# ALWAYS reply with a single JSON object - nothing else.
SYSTEM_PROMPT = """You are the natural language understanding engine for a voice \
shopping list app. The user speaks in English, Hindi, or Marathi. Convert their \
sentence into ONE JSON object and nothing else - no markdown, no explanation, no \
code fences.

The JSON must have this shape:
{
  "action": "add" | "remove" | "update" | "search" | "clear" | "unknown",
  "item": string or null,
  "quantity": integer or null,
  "category": string or null,
  "brand": string or null,
  "max_price": number or null
}

Rules:
- "action" is required and must be exactly one of: add, remove, update, search, clear, unknown.
- Translate/normalize the item name into simple English (e.g. "doodh" -> "milk").
- If the user says something like "add two bottles of water", set item="water", quantity=2.
- If no quantity is mentioned for an add/update action, default quantity to 1.
- For "update milk quantity to five", action="update", item="milk", quantity=5.
- For "find toothpaste under 200" or "find organic apples", action="search", item is the \
  product, and max_price is the numeric limit if mentioned.
- If a brand name is mentioned (e.g. "Colgate", "Amul"), extract it into "brand" and keep \
  "item" as the general product name (e.g. item="toothpaste", brand="Colgate").
- For "clear the list" / "empty my list", action="clear" and item=null.
- If you cannot confidently understand the command, action="unknown".
- Respond with ONLY the JSON object, no other text.

Examples:
Input: "Add two bottles of milk"
Output: {"action":"add","item":"milk","quantity":2,"category":"Dairy","brand":null,"max_price":null}

Input: "Remove milk"
Output: {"action":"remove","item":"milk","quantity":null,"category":null,"brand":null,"max_price":null}

Input: "Update milk to five packets"
Output: {"action":"update","item":"milk","quantity":5,"category":null,"brand":null,"max_price":null}

Input: "Find organic apples under 500"
Output: {"action":"search","item":"organic apples","quantity":null,"category":null,"brand":null,"max_price":500}

Input: "Find Colgate toothpaste under 200"
Output: {"action":"search","item":"toothpaste","quantity":null,"category":null,"brand":"Colgate","max_price":200}
"""

REQUIRED_KEYS = {"action", "item", "quantity", "category", "brand", "max_price"}
VALID_ACTIONS = {"add", "remove", "update", "search", "clear", "unknown"}


class GeminiTimeoutError(Exception):
    """Raised when the Gemini API call fails or times out."""


def _extract_json(raw_text: str) -> dict:
    """
    Defensively extract a JSON object from Gemini's response, in case it
    wraps the JSON in markdown code fences or adds stray whitespace/text.
    """
    text = raw_text.strip()
    text = re.sub(r"^```(json)?", "", text).strip()
    text = re.sub(r"```$", "", text).strip()

    # Fallback: grab the first {...} block if there's still extra text around it.
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        text = match.group(0)

    return json.loads(text)


def _normalize_result(data: dict) -> dict:
    """Fill in any missing keys and coerce the action into a valid value."""
    normalized = {key: data.get(key) for key in REQUIRED_KEYS}
    if normalized["action"] not in VALID_ACTIONS:
        normalized["action"] = "unknown"
    if normalized["action"] in ("add", "update") and not normalized.get("quantity"):
        normalized["quantity"] = 1
    return normalized


def rule_based_fallback(text: str) -> dict:
    """
    A lightweight rule-based parser used when Gemini is unavailable (no API
    key configured) or when the API call fails. Keeps the app fully
    functional in local/demo environments without a Gemini key.
    """
    lowered = text.lower().strip()

    number_words = {
        "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
        "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    }

    def extract_quantity(s: str) -> int | None:
        match = re.search(r"\b(\d+)\b", s)
        if match:
            return int(match.group(1))
        for word, value in number_words.items():
            if re.search(rf"\b{word}\b", s):
                return value
        return None

    def extract_max_price(s: str) -> float | None:
        match = re.search(r"under\s+(\d+(\.\d+)?)", s)
        return float(match.group(1)) if match else None

    def clean_item(s: str, stopwords: list[str]) -> str:
        for w in stopwords:
            s = s.replace(w, "")
        s = re.sub(r"\b(\d+)\b", "", s)
        for word in number_words:
            s = re.sub(rf"\b{word}\b", "", s)
        return re.sub(r"\s+", " ", s).strip()

    if any(k in lowered for k in ["remove", "delete"]):
        item = clean_item(lowered, ["remove", "delete", "please"])
        return _normalize_result({"action": "remove", "item": item})

    if any(k in lowered for k in ["update", "change"]):
        qty = extract_quantity(lowered)
        item = clean_item(lowered, ["update", "change", "quantity", "to", "please"])
        return _normalize_result({"action": "update", "item": item, "quantity": qty})

    if any(k in lowered for k in ["find", "search", "look for"]):
        max_price = extract_max_price(lowered)
        item = clean_item(lowered, ["find", "search", "look for", "under", "please"])
        item = re.sub(r"\d+(\.\d+)?", "", item).strip()
        return _normalize_result({"action": "search", "item": item, "max_price": max_price})

    if any(k in lowered for k in ["clear", "empty"]):
        return _normalize_result({"action": "clear", "item": None})

    if any(k in lowered for k in ["add", "buy", "need", "get me", "please buy", "i need"]):
        qty = extract_quantity(lowered)
        item = clean_item(
            lowered, ["add", "buy", "need", "get me", "please", "i", "bottles of",
                      "packets of", "some", "organic"]
        )
        return _normalize_result({"action": "add", "item": item, "quantity": qty})

    return _normalize_result({"action": "unknown", "item": lowered})


async def interpret_command(text: str, language: str = "en") -> dict:
    """
    Send the recognized speech text to Gemini and return a normalized,
    validated dict describing the user's intent.

    Falls back to a rule-based parser if Gemini is not configured or fails,
    so the application keeps working without an API key.
    """
    if not _client:
        logger.info("GEMINI_API_KEY not set - using rule-based fallback parser.")
        return rule_based_fallback(text)

    try:
        prompt = f"{SYSTEM_PROMPT}\n\nInput (language={language}): \"{text}\"\nOutput:"
        response = _client.models.generate_content(model=MODEL_NAME, contents=prompt)
        raw_text = response.text
        data = _extract_json(raw_text)
        return _normalize_result(data)
    except Exception as exc:  # noqa: BLE001 - broad on purpose, we always want a fallback
        logger.warning("Gemini call failed (%s); falling back to rule-based parser.", exc)
        return rule_based_fallback(text)