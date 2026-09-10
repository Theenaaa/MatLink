from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database.base import Base


class MaterialAttribute(Base):
    """
    STRUCTURED ATTRIBUTE STORAGE for Phase 3.
    Stores multi-dimensional technical attributes extracted from raw descriptions.
    Preserves raw value, normalized canonical value, unit, confidence, and method.
    """
    __tablename__ = "material_attributes"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True)
    attribute_name = Column(String(100), nullable=False, index=True)
    raw_value = Column(String(255), nullable=True)
    normalized_value = Column(String(255), nullable=True)
    normalized_unit = Column(String(50), nullable=True)
    confidence_score = Column(Float, default=1.0, nullable=False)
    extraction_method = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    material = relationship("Material", back_populates="attributes")

    __table_args__ = (
        Index("ix_material_attributes_mat_attr", "material_id", "attribute_name"),
    )

    def __repr__(self):
        return f"<MaterialAttribute {self.attribute_name}={self.normalized_value} {self.normalized_unit or ''} (Material {self.material_id})>"
