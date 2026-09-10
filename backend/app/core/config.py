import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "CANONIX"
    PROJECT_DESCRIPTION: str = "National Material Code Standardization & Harmonization Platform Across CPSEs"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, v: Union[bool, str, int, None]) -> bool:
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes", "on", "debug", "dev", "development")
        if isinstance(v, int):
            return v == 1
        return True

    # Database (Supports Render PostgreSQL, Neon, Supabase, Docker, Local)
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/canonix"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Union[str, None]) -> str:
        if not v:
            return "postgresql+psycopg2://postgres:postgres@localhost:5432/canonix"
        # Render and other cloud providers provide postgres:// which SQLAlchemy deprecated in favor of postgresql://
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+psycopg2://", 1)
        elif v.startswith("postgresql://") and not v.startswith("postgresql+"):
            v = v.replace("postgresql://", "postgresql+psycopg2://", 1)
        return v

    # Security & JWT
    JWT_SECRET: str = "canonix_super_secure_enterprise_secret_key_2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, list):
            return v
        return [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
        ]

    # Configurable Matching Weights (Correction #8)
    SEMANTIC_WEIGHT: float = 0.40
    ATTRIBUTE_WEIGHT: float = 0.30
    RULE_WEIGHT: float = 0.20
    CLASSIFICATION_WEIGHT: float = 0.10

    # AI Model Configuration (Correction #11)
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    VECTOR_DIMENSION: int = 384

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()

