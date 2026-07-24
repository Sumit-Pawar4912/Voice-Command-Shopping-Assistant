"""
Application configuration.

Loads environment variables using pydantic-settings so the rest of the
codebase can import a single, typed `settings` object instead of calling
os.environ directly everywhere.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed application settings, populated from environment variables / .env file."""

    gemini_api_key: str = ""
    database_url: str = "sqlite:///./shopping.db"
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        """Return allowed_origins as a clean list of strings."""
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (avoids re-parsing env on every import)."""
    return Settings()


settings = get_settings()
