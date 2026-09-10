from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database.session import get_db
from app.models.user import User
from app.models.cpse import CPSE
from app.models.material import Material
from app.models.uploaded_file import UploadedFile
from app.models.validation_error import ValidationError
from app.models.processing_job import ProcessingJob
from app.schemas.ingestion import DashboardMetricsResponse
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard Real Metrics"])


@router.get("/metrics", response_model=DashboardMetricsResponse)
def get_dashboard_metrics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Returns REAL, DATABASE-DRIVEN metrics.
    No hardcoded or fabricated statistics.
    Super Admin receives cross-CPSE aggregate counts + per-CPSE breakdown.
    CPSE Users receive counts strictly scoped to their organization.
    """
    user_role = current_user.role.name if current_user.role else "USER"
    is_super_admin = (user_role == "SUPER_ADMIN")

    if is_super_admin:
        total_materials = db.query(func.count(Material.id)).scalar() or 0
        total_datasets = db.query(func.count(UploadedFile.id)).scalar() or 0
        total_errors = db.query(func.count(ValidationError.id)).scalar() or 0
        total_jobs = db.query(func.count(ProcessingJob.id)).scalar() or 0
        total_normalized = db.query(func.count(Material.id)).filter(Material.normalization_status == "NORMALIZED").scalar() or 0
        total_review = db.query(func.count(Material.id)).filter(Material.normalization_status == "REVIEW_REQUIRED").scalar() or 0

        # Per-CPSE breakdown
        all_cpses = db.query(CPSE).all()
        breakdown = []
        for c in all_cpses:
            mat_cnt = db.query(func.count(Material.id)).filter(Material.cpse_id == c.id).scalar() or 0
            file_cnt = db.query(func.count(UploadedFile.id)).filter(UploadedFile.cpse_id == c.id).scalar() or 0
            breakdown.append({
                "id": c.id,
                "code": c.code,
                "name": c.name,
                "status": c.status,
                "materials_count": mat_cnt,
                "datasets_count": file_cnt,
            })

        return DashboardMetricsResponse(
            total_materials=total_materials,
            total_datasets=total_datasets,
            total_validation_errors=total_errors,
            total_processing_jobs=total_jobs,
            total_normalized=total_normalized,
            total_review_required=total_review,
            cpse_code="UNIVERSAL",
            cpse_name="National Master Hub (All CPSEs)",
            is_super_admin=True,
            cpse_breakdown=breakdown,
        )
    else:
        cpse_id = current_user.cpse_id
        cpse_code = current_user.cpse.code if current_user.cpse else "UNKNOWN"
        cpse_name = current_user.cpse.name if current_user.cpse else "Unknown Enterprise"

        total_materials = db.query(func.count(Material.id)).filter(Material.cpse_id == cpse_id).scalar() or 0
        total_datasets = db.query(func.count(UploadedFile.id)).filter(UploadedFile.cpse_id == cpse_id).scalar() or 0
        total_normalized = db.query(func.count(Material.id)).filter(Material.cpse_id == cpse_id, Material.normalization_status == "NORMALIZED").scalar() or 0
        total_review = db.query(func.count(Material.id)).filter(Material.cpse_id == cpse_id, Material.normalization_status == "REVIEW_REQUIRED").scalar() or 0
        
        # Scoped errors
        total_errors = (
            db.query(func.count(ValidationError.id))
            .join(UploadedFile, ValidationError.uploaded_file_id == UploadedFile.id)
            .filter(UploadedFile.cpse_id == cpse_id)
            .scalar() or 0
        )

        # Scoped jobs
        total_jobs = (
            db.query(func.count(ProcessingJob.id))
            .join(UploadedFile, ProcessingJob.uploaded_file_id == UploadedFile.id)
            .filter(UploadedFile.cpse_id == cpse_id)
            .scalar() or 0
        )

        return DashboardMetricsResponse(
            total_materials=total_materials,
            total_datasets=total_datasets,
            total_validation_errors=total_errors,
            total_processing_jobs=total_jobs,
            total_normalized=total_normalized,
            total_review_required=total_review,
            cpse_code=cpse_code,
            cpse_name=cpse_name,
            is_super_admin=False,
            cpse_breakdown=None,
        )
