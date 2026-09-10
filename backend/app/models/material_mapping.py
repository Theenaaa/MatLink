from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.base import Base


class MaterialMapping(Base):
    """
    CANONIX Legacy Material Mapping Layer (Phase 5).
    Connects raw CPSE legacy materials to unified National Material Identities.
    Tracks mapping type, confidence, and human approval status.
    """
    __tablename__ = "material_mappings"

    id = Column(Integer, primary_key=True, index=True)
    national_material_id = Column(Integer, ForeignKey("national_materials.id", ondelete="CASCADE"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True)
    cpse_id = Column(Integer, ForeignKey("cpse.id", ondelete="CASCADE"), nullable=False, index=True)

    # Mapping types: PRIMARY, EQUIVALENT, NEAR_DUPLICATE, FUNCTIONALLY_EQUIVALENT, APPROVED_SUBSTITUTE
    mapping_type = Column(String(50), nullable=False)
    confidence_score = Column(Float, nullable=False)

    # Strict specification: Default status is PENDING. Only authorized human approval changes to APPROVED.
    status = Column(String(50), default="PENDING", nullable=False, index=True)  # PENDING, APPROVED, REJECTED
    notes = Column(Text, nullable=True)

    approved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    national_material = relationship("NationalMaterial", back_populates="mappings")
    material = relationship("Material", backref="national_mappings")
    cpse = relationship("CPSE")
    approver = relationship("User", foreign_keys=[approved_by])

    __table_args__ = (
        UniqueConstraint("national_material_id", "material_id", name="uq_national_material_mapping"),
        UniqueConstraint("material_id", name="uq_material_single_national_mapping"),
    )

    def __repr__(self):
        return f"<MaterialMapping NatMat={self.national_material_id} Mat={self.material_id} [{self.mapping_type}:{self.status}]>"
