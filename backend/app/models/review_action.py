from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database.base import Base


class ReviewAction(Base):
    """
    CANONIX Expert Review History Layer (Phase 5).
    Maintains an immutable historical record of every human expert validation event.
    Preserves original AI decisions alongside human modifications and comments.
    """
    __tablename__ = "review_actions"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("material_matches.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # Actions: APPROVE, REJECT, MODIFY, REQUEST_REVIEW
    action = Column(String(50), nullable=False)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)

    previous_relationship = Column(String(50), nullable=True)
    new_relationship = Column(String(50), nullable=True)

    comment = Column(Text, nullable=True)
    modified_data = Column(JSONB, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    match = relationship("MaterialMatch", backref="review_history")
    reviewer = relationship("User", foreign_keys=[reviewer_id])

    def __repr__(self):
        return f"<ReviewAction Match={self.match_id} Action={self.action} by User={self.reviewer_id}>"
