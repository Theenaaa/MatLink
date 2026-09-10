from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.database.session import get_db
from app.models.user import User
from app.models.uploaded_file import UploadedFile
from app.models.cpse import CPSE
from app.models.validation_error import ValidationError
from app.models.processing_job import ProcessingJob
from app.schemas.ingestion import (
    UploadValidationResponse,
    ValidationErrorItem,
    MaterialRowPreview,
    UploadedFileListResponse,
    UploadedFileDetailResponse,
    ImportResponse,
)
from app.api.deps import get_current_active_user, enforce_cpse_access
from app.services.ingestion import parse_and_validate_file, import_validated_dataset

router = APIRouter(prefix="/uploads", tags=["Dataset Ingestion & Management"])


@router.post("", response_model=UploadValidationResponse)
async def upload_and_validate_dataset(
    file: UploadFile = File(...),
    target_cpse_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Multipart upload endpoint for CSV, XLSX, XLS.
    Deterministically binds the upload to the authenticated user's CPSE.
    The uploaded file DOES NOT require a CPSE column.
    Runs all 11 enterprise validation rules and stores row-level errors.
    """
    user_role = current_user.role.name if current_user.role else "USER"

    # Determine CPSE ID
    if user_role == "SUPER_ADMIN":
        # Super admin can specify target CPSE or default to first active CPSE
        if target_cpse_id:
            cpse = db.query(CPSE).filter(CPSE.id == target_cpse_id).first()
            if not cpse:
                raise HTTPException(status_code=404, detail="Target CPSE not found.")
            effective_cpse = cpse
        else:
            effective_cpse = db.query(CPSE).first()
            if not effective_cpse:
                raise HTTPException(status_code=400, detail="No CPSE configured in system.")
    else:
        # Strict tenant binding: Never trust user parameter, use authenticated user's organization
        if not current_user.cpse:
            raise HTTPException(status_code=403, detail="User is not associated with an enterprise CPSE.")
        effective_cpse = current_user.cpse

    # Read file content safely
    contents = await file.read()
    if not contents or len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Max size check (e.g. 50MB)
    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 50MB limit.")

    try:
        uploaded_file, valid_rows, errors = parse_and_validate_file(
            file_bytes=contents,
            file_name=file.filename or "dataset.csv",
            cpse_id=effective_cpse.id,
            user_id=current_user.id,
            db=db,
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    # Build preview of first 10 valid rows
    preview = [
        MaterialRowPreview(
            source_row_number=r["source_row_number"],
            material_code=r["material_code"],
            raw_description=r["raw_description"],
            order_qty=r["order_qty"],
            uom=r["uom"],
        )
        for r in valid_rows[:10]
    ]

    return UploadValidationResponse(
        file_id=uploaded_file.id,
        file_name=uploaded_file.file_name,
        file_type=uploaded_file.file_type,
        file_size=uploaded_file.file_size,
        status=uploaded_file.status,
        cpse_code=effective_cpse.code,
        total_rows=uploaded_file.total_rows,
        valid_rows=uploaded_file.valid_rows,
        invalid_rows=uploaded_file.invalid_rows,
        warnings=0,
        errors=[ValidationErrorItem.model_validate(e) for e in errors[:50]],  # Cap sample to 50
        preview_valid_rows=preview,
    )


@router.post("/{file_id}/import", response_model=ImportResponse)
def import_dataset(
    file_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Imports all valid rows of a validated file into the raw materials table.
    Ensures complete historical traceability (uploaded_file_id, source_row_number).
    """
    uploaded_file = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not uploaded_file:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    # Enforce tenant isolation
    enforce_cpse_access(uploaded_file.cpse_id, current_user)

    try:
        count = import_validated_dataset(
            uploaded_file_id=file_id,
            cpse_id=uploaded_file.cpse_id,
            db=db,
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    return ImportResponse(
        file_id=file_id,
        status="COMPLETED",
        total_imported=count,
        message=f"Successfully imported {count} raw materials into {uploaded_file.cpse.code} catalog.",
    )


@router.get("", response_model=List[UploadedFileListResponse])
def list_datasets(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Lists uploaded datasets scoped strictly to the authenticated CPSE.
    SUPER_ADMIN has universal visibility across all CPSEs.
    """
    user_role = current_user.role.name if current_user.role else "USER"
    query = db.query(UploadedFile).options(joinedload(UploadedFile.cpse))

    if user_role != "SUPER_ADMIN":
        query = query.filter(UploadedFile.cpse_id == current_user.cpse_id)

    files = query.order_by(UploadedFile.created_at.desc()).all()

    result = []
    for f in files:
        result.append(
            UploadedFileListResponse(
                id=f.id,
                cpse_id=f.cpse_id,
                cpse_code=f.cpse.code if f.cpse else "UNKNOWN",
                file_name=f.file_name,
                file_type=f.file_type,
                file_size=f.file_size,
                data_type=f.data_type,
                total_rows=f.total_rows,
                valid_rows=f.valid_rows,
                invalid_rows=f.invalid_rows,
                status=f.status,
                uploaded_at=f.uploaded_at,
                processed_at=f.processed_at,
            )
        )
    return result


@router.get("/{file_id}", response_model=UploadedFileDetailResponse)
def get_dataset_details(
    file_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Detailed view of a dataset: file metadata, validation errors, and async processing jobs.
    Enforces CPSE tenant isolation.
    """
    uploaded_file = (
        db.query(UploadedFile)
        .options(
            joinedload(UploadedFile.cpse),
            joinedload(UploadedFile.uploader),
            joinedload(UploadedFile.validation_errors),
            joinedload(UploadedFile.processing_jobs),
        )
        .filter(UploadedFile.id == file_id)
        .first()
    )

    if not uploaded_file:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    # Enforce tenant isolation
    enforce_cpse_access(uploaded_file.cpse_id, current_user)

    return UploadedFileDetailResponse(
        id=uploaded_file.id,
        cpse_id=uploaded_file.cpse_id,
        cpse_code=uploaded_file.cpse.code if uploaded_file.cpse else None,
        cpse_name=uploaded_file.cpse.name if uploaded_file.cpse else None,
        file_name=uploaded_file.file_name,
        file_type=uploaded_file.file_type,
        file_size=uploaded_file.file_size,
        data_type=uploaded_file.data_type,
        total_rows=uploaded_file.total_rows,
        valid_rows=uploaded_file.valid_rows,
        invalid_rows=uploaded_file.invalid_rows,
        status=uploaded_file.status,
        uploaded_by=uploaded_file.uploaded_by,
        uploader_name=uploaded_file.uploader.name if uploaded_file.uploader else None,
        uploader_email=uploaded_file.uploader.email if uploaded_file.uploader else None,
        uploaded_at=uploaded_file.uploaded_at,
        processed_at=uploaded_file.processed_at,
        validation_errors=[ValidationErrorItem.model_validate(e) for e in uploaded_file.validation_errors[:100]],
        processing_jobs=uploaded_file.processing_jobs,
    )
