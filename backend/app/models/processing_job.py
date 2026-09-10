from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class ProcessingJob(Base):
    """
    Asynchronous job execution tracker for ingestion, validation, and batch imports.
    Extensible for future AI pipeline stages.
    """
    __tablename__ = "processing_jobs"

    id = Column(Integer, primary_key=True, index=True)
    uploaded_file_id = Column(Integer, ForeignKey("uploaded_files.id", ondelete="CASCADE"), nullable=True, index=True)
    job_type = Column(String(50), nullable=False)  # VALIDATION, IMPORT, NORMALIZATION
    status = Column(String(50), default="QUEUED", nullable=False)  # QUEUED, PROCESSING, COMPLETED, FAILED
    total_records = Column(Integer, default=0, nullable=False)
    processed_records = Column(Integer, default=0, nullable=False)
    successful_records = Column(Integer, default=0, nullable=False)
    failed_records = Column(Integer, default=0, nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)

    uploaded_file = relationship("UploadedFile", back_populates="processing_jobs")

    def __repr__(self):
        return f"<ProcessingJob {self.id}: {self.job_type} [{self.status}]>"
