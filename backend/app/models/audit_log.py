from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database.base import Base


class AuditLog(Base):
    """
    CANONIX Platform Audit Trail Layer (Phase 5).
    Tracks all governance, expert validations, national identity approvals, and mappings.
    Never stores passwords or secret keys.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    action = Column(String(100), nullable=False, index=True)  # MATCH_APPROVE, MATCH_REJECT, NATIONAL_MATERIAL_CREATE, etc.
    entity_type = Column(String(100), nullable=False, index=True)  # MaterialMatch, NationalMaterial, MaterialMapping
    entity_id = Column(Integer, nullable=True, index=True)

    old_values = Column(JSONB, nullable=True)
    new_values = Column(JSONB, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    user = relationship("User")

    def __repr__(self):
        return f"<AuditLog Action={self.action} Entity={self.entity_type}:{self.entity_id} User={self.user_id}>"
