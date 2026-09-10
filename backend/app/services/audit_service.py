"""
CANONIX Platform Audit Service
Centralized helper for immutable governance logging across validations, approvals, and mappings.
Strictly redacts sensitive keys (passwords, tokens).
"""

import logging
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)

SENSITIVE_KEYS = {"password", "password_hash", "token", "access_token", "secret", "jwt_secret"}


def _sanitize_dict(d: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not d or not isinstance(d, dict):
        return d
    return {k: ("***REDACTED***" if k.lower() in SENSITIVE_KEYS else v) for k, v in d.items()}


def log_audit_event(
    db: Session,
    user_id: Optional[int],
    action: str,
    entity_type: str,
    entity_id: Optional[int],
    old_values: Optional[Dict[str, Any]] = None,
    new_values: Optional[Dict[str, Any]] = None,
) -> AuditLog:
    """
    Persists an immutable audit log entry.
    """
    clean_old = _sanitize_dict(old_values)
    clean_new = _sanitize_dict(new_values)

    entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_values=clean_old,
        new_values=clean_new,
    )
    db.add(entry)
    db.flush()
    logger.info(f"[AUDIT] user={user_id} action={action} entity={entity_type}:{entity_id}")
    return entry
