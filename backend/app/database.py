"""
Database engine and session management for SQLAlchemy.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

# `check_same_thread` is only needed for SQLite since FastAPI may use the
# connection across different threads within the same request lifecycle.
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all ORM models."""


def get_db() -> Generator:
    """FastAPI dependency that yields a database session and ensures it's closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all database tables if they don't already exist."""
    # Import models here so they are registered on Base's metadata before create_all.
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
