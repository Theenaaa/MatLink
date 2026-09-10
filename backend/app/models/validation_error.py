from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class ValidationError(Base):
    """
    Granular row-level upload and ingestion validation error tracking.
    """
    __tablename__ = "validation_errors"

    id = Column(Integer, primary_key=True, index=True)
    uploaded_file_id = Column(Integer, ForeignKey("uploaded_files.id", ondelete="CASCADE"), nullable=False, index=True)
    row_number = Column(Integer, nullable=False)
    column_name = Column(String(100), nullable=False)
    error_type = Column(String(100), nullable=False)  # MISSING_HEADER, MISSING_FIELD, DUPLICATE_IN_BATCH, DUPLICATE_IN_CPSE, INVALID_NUMERIC, NEGATIVE_VALUE
    error_message = Column(Text, nullable=False)
    raw_value = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    uploaded_file = relationship("UploadedFile", back_populates="validation_errors")

    def __repr__(self):
        return f"<ValidationError File:{self.uploaded_file_id} Row:{self.row_number} Col:{self.column_name}>"
