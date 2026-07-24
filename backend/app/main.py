"""
FastAPI application entrypoint for the Voice Command Shopping Assistant.
"""

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.routes import router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Voice Command Shopping Assistant API",
    description=(
        "Backend API for a voice-controlled shopping list app. Handles speech-to-text "
        "command interpretation (via Gemini), shopping list CRUD, smart recommendations, "
        "and product search."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    """Initialize the database schema on application startup."""
    init_db()
    logger.info("Database initialized.")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catch-all handler so unexpected errors return clean JSON instead of a stack trace."""
    logger.exception("Unhandled exception on %s", request.url)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred. Please try again."},
    )


@app.get("/", tags=["Health"])
def health_check():
    """Simple health check / welcome endpoint."""
    return {"status": "ok", "message": "Voice Command Shopping Assistant API is running."}


app.include_router(router, prefix="/api")
