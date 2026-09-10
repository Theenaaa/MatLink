from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.database.session import get_db

router = APIRouter()


@router.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "description": settings.PROJECT_DESCRIPTION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "matching_weights": {
            "semantic": settings.SEMANTIC_WEIGHT,
            "attribute": settings.ATTRIBUTE_WEIGHT,
            "rule": settings.RULE_WEIGHT,
            "classification": settings.CLASSIFICATION_WEIGHT,
        }
    }


@router.get("/health/db", tags=["Health"])
def db_health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "connected",
            "database": "PostgreSQL",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        return {
            "status": "error",
            "detail": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
