from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database.base import Base


class MaterialEmbedding(Base):
    __tablename__ = "material_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    embedding = Column(JSONB, nullable=False)  # 384-dimensional vector stored as JSON array of floats
    model_name = Column(String(100), default="sentence-transformers/all-MiniLM-L6-v2", nullable=False)
    embedding_version = Column(String(50), default="v1.0", nullable=False)
    source_text_hash = Column(String(64), nullable=False, index=True)  # SHA-256 hash of deterministic input text
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    material = relationship("Material", back_populates="embedding")

    def __repr__(self):
        return f"<MaterialEmbedding material_id={self.material_id} model={self.model_name}>"
