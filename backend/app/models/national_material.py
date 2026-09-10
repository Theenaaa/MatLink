from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database.base import Base


class NationalMaterial(Base):
    """
    CANONIX National Material Identity Layer (Phase 5).
    Represents the unified, human-validated national standard material identity.
    Preserves complete lineage to originating AI matches and Material DNA.
    """
    __tablename__ = "national_materials"

    id = Column(Integer, primary_key=True, index=True)
    national_material_code = Column(String(100), unique=True, index=True, nullable=False)  # NM-000001
    canonical_description = Column(Text, nullable=False)
    material_type = Column(String(100), nullable=False, index=True)
    material_group = Column(String(100), nullable=False, index=True)
    material_dna = Column(JSONB, nullable=False)  # Structured technical attributes
    status = Column(String(50), default="PENDING_APPROVAL", nullable=False, index=True)  # DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, RETIRED

    originating_match_id = Column(Integer, ForeignKey("material_matches.id", ondelete="SET NULL"), nullable=True)
    ai_evidence = Column(JSONB, nullable=True)  # Detailed AI match scores, explanation, and lineage

    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    mappings = relationship("MaterialMapping", back_populates="national_material", cascade="all, delete-orphan")
    originating_match = relationship("MaterialMatch", foreign_keys=[originating_match_id])
    creator = relationship("User", foreign_keys=[created_by])
    approver = relationship("User", foreign_keys=[approved_by])

    def __repr__(self):
        return f"<NationalMaterial {self.national_material_code} [{self.status}] {self.material_type}>"
