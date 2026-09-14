"""
Application configuration. All settings load from environment variables
(or a .env file in dev). Never commit real secrets.
"""
from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "PRAMAAN API"
    ENVIRONMENT: str = "development"

    # Dev default: local SQLite, zero setup. Production: swap to
    # postgresql+asyncpg://user:pass@host:5432/dbname — no code changes needed.
    DATABASE_URL: str = "sqlite+aiosqlite:///./pramaan.db"


    JWT_SECRET_KEY: str = "change-me-in-production-use-a-real-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # ECDSA signing keys (PEM strings). If unset, an ephemeral dev keypair
    # is generated at startup — fine for local testing, NOT for production
    # (restarting invalidates every certificate signed under the old key).
    SIGNING_PRIVATE_KEY_PEM: str | None = None
    SIGNING_PUBLIC_KEY_PEM: str | None = None

    PUBLIC_BASE_URL: str = "https://pramaan-ntro.vercel.app"

    # Additional CORS origins beyond PUBLIC_BASE_URL — comma-separated.
    # Example: "https://pramaan.ntro.gov.in,https://www.pramaan.ntro.gov.in"
    EXTRA_CORS_ORIGINS: str = ""

    @property
    def allowed_origins(self) -> list[str]:
        origins = [self.PUBLIC_BASE_URL]
        if self.EXTRA_CORS_ORIGINS:
            origins += [o.strip() for o in self.EXTRA_CORS_ORIGINS.split(",") if o.strip()]
        origins.extend([
            "https://pramaan-ntro.vercel.app",
            "http://localhost:3000",
            "http://localhost:5173",
        ])
        return list(dict.fromkeys(origins))

    @field_validator("PUBLIC_BASE_URL")
    @classmethod
    def _normalize_public_base_url(cls, v: str) -> str:
        if not v or "pramaan-frontend.vercel.app" in v or "pramaan.vercel.app" in v or "localhost" in v:
            return "https://pramaan-ntro.vercel.app"
        return v.strip().rstrip("/")

    @field_validator("DATABASE_URL")
    @classmethod
    def _normalize_database_url(cls, v: str) -> str:
        """Strip quotes/whitespace and normalize postgres:// or postgresql://
        to postgresql+asyncpg://, replace sslmode= with ssl= for asyncpg,
        and strip unsupported query params like channel_binding."""
        if not v:
            return "sqlite+aiosqlite:///./forensicguard.db"
        clean = v.strip().strip('"').strip("'")
        import re
        if "sslmode=" in clean:
            clean = re.sub(r"([?&])sslmode=([^&]*)", r"\1ssl=\2", clean)
        if "channel_binding=" in clean:
            clean = re.sub(r"[&?]channel_binding=[^&]*", "", clean)
        clean = re.sub(r"[?&]$", "", clean)
        if clean.startswith("postgres://"):
            clean = "postgresql+asyncpg://" + clean[11:]
        elif clean.startswith("postgresql://") and not clean.startswith("postgresql+asyncpg://"):
            clean = "postgresql+asyncpg://" + clean[13:]
        elif clean.startswith("sqlite+aiosqlite:///"):
            path = clean.replace("sqlite+aiosqlite:///", "")
            if path.startswith("./"):
                rel = path[2:]
                import os
                backend_db = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", rel))
                if not os.path.exists(path) and os.path.exists(backend_db):
                    clean = f"sqlite+aiosqlite:///{backend_db}"
        return clean



    @field_validator("SIGNING_PRIVATE_KEY_PEM", "SIGNING_PUBLIC_KEY_PEM")
    @classmethod
    def _unescape_pem_newlines(cls, v: str | None) -> str | None:
        """.env files can't hold real multi-line values. Convention: store
        the PEM with literal \\n sequences, unescape them here."""
        if v is None:
            return v
        return v.replace("\\n", "\n")


@lru_cache
def get_settings() -> Settings:
    return Settings()

