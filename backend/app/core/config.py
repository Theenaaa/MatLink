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

    # Database (Docker PostgreSQL / pgvector on port 5432)
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/canonix"



    # Security & JWT
    JWT_SECRET: str = "canonix_super_secure_enterprise_secret_key_sih_2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS
    CORS_ORIGINS: List[str] = [
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
