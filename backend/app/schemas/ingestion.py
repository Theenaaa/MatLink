from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


class ValidationErrorItem(BaseModel):
    row_number: int
    column_name: str
    error_type: str
    error_message: str
    raw_value: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class MaterialRowPreview(BaseModel):
    source_row_number: int
    material_code: str
    raw_description: str
    order_qty: float
    uom: str


class UploadValidationResponse(BaseModel):
    file_id: int
    file_name: str
    file_type: str
    file_size: int
    status: str
    cpse_code: str
    total_rows: int
    valid_rows: int
    invalid_rows: int
    warnings: int
    errors: List[ValidationErrorItem]
    preview_valid_rows: List[MaterialRowPreview]


class ProcessingJobResponse(BaseModel):
    id: int
    job_type: str
    status: str
    total_records: int
    processed_records: int
    failed_records: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UploadedFileListResponse(BaseModel):
    id: int
    cpse_id: int
    cpse_code: Optional[str] = None
    file_name: str
    file_type: str
    file_size: int
    data_type: str
    total_rows: int
    valid_rows: int
    invalid_rows: int
    status: str
    uploaded_at: datetime
    processed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UploadedFileDetailResponse(BaseModel):
    id: int
    cpse_id: int
    cpse_code: Optional[str] = None
    cpse_name: Optional[str] = None
    file_name: str
    file_type: str
    file_size: int
    data_type: str
    total_rows: int
    valid_rows: int
    invalid_rows: int
    status: str
    uploaded_by: Optional[int] = None
    uploader_name: Optional[str] = None
    uploader_email: Optional[str] = None
    uploaded_at: datetime
    processed_at: Optional[datetime] = None
    validation_errors: List[ValidationErrorItem] = []
    processing_jobs: List[ProcessingJobResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ImportResponse(BaseModel):
    file_id: int
    status: str
    total_imported: int
    message: str


class MaterialAttributeResponse(BaseModel):
    id: int
    attribute_name: str
    raw_value: Optional[str] = None
    normalized_value: Optional[str] = None
    normalized_unit: Optional[str] = None
    confidence_score: float
    extraction_method: str

    model_config = ConfigDict(from_attributes=True)


class MaterialResponse(BaseModel):
    id: int
    cpse_id: int
    cpse_code: Optional[str] = None
    uploaded_file_id: Optional[int] = None
    file_name: Optional[str] = None
    source_row_number: Optional[int] = None
    material_code: str
    raw_description: str
    order_qty: float
    uom: str
    status: str
    normalization_status: str = "RAW"
    material_type: Optional[str] = None
    material_group: Optional[str] = None
    normalized_description: Optional[str] = None
    canonical_description: Optional[str] = None
    normalized_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MaterialDetailResponse(MaterialResponse):
    cpse_name: Optional[str] = None
    material_dna: Optional[Dict[str, Any]] = None
    attributes: List[MaterialAttributeResponse] = []
    national_mapping: Optional[Dict[str, Any]] = None


class PaginatedMaterialsResponse(BaseModel):
    items: List[MaterialResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class BatchNormalizeRequest(BaseModel):
    uploaded_file_id: Optional[int] = None
    limit: Optional[int] = None


class BatchNormalizeResponse(BaseModel):
    total_processed: int
    normalized_count: int
    review_required_count: int
    failed_count: int
    message: str
    job_id: Optional[int] = None


class DashboardMetricsResponse(BaseModel):
    total_materials: int
    total_datasets: int
    total_validation_errors: int
    total_processing_jobs: int
    total_normalized: int = 0
    total_review_required: int = 0
    cpse_code: str
    cpse_name: str
    is_super_admin: bool
    cpse_breakdown: Optional[List[Dict[str, Any]]] = None

