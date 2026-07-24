# save as check_env.py inside backend/, then run: python check_env.py
from app.config import settings

key = settings.gemini_api_key
print("Key loaded:", bool(key))
print("Key length:", len(key) if key else 0)
print("Key preview:", key[:6] + "..." if key else "(empty)")