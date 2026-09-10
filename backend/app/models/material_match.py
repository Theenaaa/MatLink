from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database.base import Base


class MaterialMatch(Base):
    __tablename__ = "material_matches"

    id = Column(Integer, primary_key=True, index=True)
    # Canonical ordering: material_a_id is always strictly less than material_b_id
    material_a_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True)
    material_b_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True)

    semantic_score = Column(Float, nullable=False)
    attribute_score = Column(Float, nullable=False)
    rule_score = Column(Float, nullable=False)
    classification_score = Column(Float, nullable=False)
    final_score = Column(Float, nullable=False, index=True)

    relationship_type = Column(String(50), nullable=False, index=True)  # SAME, NEAR_DUPLICATE, FUNCTIONALLY_EQUIVALENT, RELATED, DIFFERENT
    explanation = Column(Text, nullable=False)
    comparison_details = Column(JSONB, nullable=False)  # Attribute-by-attribute matrix with MATCH, MISMATCH, UNKNOWN, NOT_APPLICABLE
    hard_blocked = Column(Boolean, default=False, nullable=False)

    status = Column(String(50), default="PENDING", nullable=False, index=True)  # PENDING, APPROVED, REJECTED, MODIFIED
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    material_a = relationship("Material", foreign_keys=[material_a_id], backref="matches_as_a")
    material_b = relationship("Material", foreign_keys=[material_b_id], backref="matches_as_b")
    reviewer = relationship("User", foreign_keys=[reviewed_by])

    __table_args__ = (
        UniqueConstraint("material_a_id", "material_b_id", name="uq_material_pair"),
    )

    def __repr__(self):
        return f"<MaterialMatch pair=({self.material_a_id}, {self.material_b_id}) rel={self.relationship_type} score={self.final_score:.2f}>"
