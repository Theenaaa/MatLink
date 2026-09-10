from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, UniqueConstraint, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base


class Material(Base):
    """
    RAW SOURCE-OF-TRUTH Material layer.
    Preserves raw descriptions and original material codes exactly as provided by CPSEs.
    """
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    cpse_id = Column(Integer, ForeignKey("cpse.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_file_id = Column(Integer, ForeignKey("uploaded_files.id", ondelete="SET NULL"), nullable=True, index=True)
    source_row_number = Column(Integer, nullable=True)
    material_code = Column(String(100), nullable=False, index=True)
    raw_description = Column(Text, nullable=False)
    order_qty = Column(Float, default=0.0, nullable=False)
    uom = Column(String(50), nullable=False)
    status = Column(String(50), default="ACTIVE", nullable=False)
    
    # Phase 3: Material Normalization & Material DNA Layer
    # RAW DESCRIPTION IS NEVER OVERWRITTEN. Derived representations live in separate columns.
    normalized_description = Column(Text, nullable=True)
    canonical_description = Column(Text, nullable=True)
    material_type = Column(String(100), nullable=True, index=True)
    material_group = Column(String(100), nullable=True, index=True)
    material_dna = Column(JSON, nullable=True)
    normalization_status = Column(String(50), default="RAW", nullable=False, index=True)  # RAW, NORMALIZED, FAILED, REVIEW_REQUIRED
    normalized_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("cpse_id", "material_code", name="uq_materials_cpse_material_code"),
    )

    cpse = relationship("CPSE", foreign_keys=[cpse_id])
    uploaded_file = relationship("UploadedFile", back_populates="materials")
    attributes = relationship("MaterialAttribute", back_populates="material", cascade="all, delete-orphan")
    embedding = relationship("MaterialEmbedding", back_populates="material", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Material {self.material_code} ({self.cpse_id}) [{self.normalization_status}]>"
