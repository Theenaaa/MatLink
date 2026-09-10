from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    cpse_id = Column(Integer, ForeignKey("cpse.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # csv, xlsx, xls
    file_size = Column(Integer, nullable=False)     # in bytes
    data_type = Column(String(50), default="MATERIAL_MASTER", nullable=False)
    total_rows = Column(Integer, default=0, nullable=False)
    valid_rows = Column(Integer, default=0, nullable=False)
    invalid_rows = Column(Integer, default=0, nullable=False)
    status = Column(String(50), default="UPLOADED", nullable=False)  # UPLOADED, VALIDATING, VALIDATED, PROCESSING, COMPLETED, FAILED
    uploaded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    cpse = relationship("CPSE", foreign_keys=[cpse_id])
    uploader = relationship("User", foreign_keys=[uploaded_by])
    materials = relationship("Material", back_populates="uploaded_file", cascade="all, delete-orphan")
    validation_errors = relationship("ValidationError", back_populates="uploaded_file", cascade="all, delete-orphan")
    processing_jobs = relationship("ProcessingJob", back_populates="uploaded_file", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<UploadedFile {self.id}: {self.file_name} [{self.status}]>"
