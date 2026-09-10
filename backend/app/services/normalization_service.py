"""
CANONIX Normalization Database Service
Manages persistence of normalized descriptions, Material DNA, and structured attributes.
Supports arbitrary batch sizes with chunked transactions and error resilience.
RAW CPSE DESCRIPTIONS ARE NEVER OVERWRITTEN.
"""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session, joinedload

from app.models.material import Material
from app.models.material_attribute import MaterialAttribute
from app.models.processing_job import ProcessingJob
from app.services.normalization.pipeline import run_normalization_pipeline, NormalizationResult


def normalize_material_record(material: Material, db: Session, commit: bool = True) -> Material:
    """
    Executes normalization on a single Material model record and saves results to DB.
    Guarantees that raw_description and material_code remain 100% unaltered.
    """
    result: NormalizationResult = run_normalization_pipeline(material.raw_description)

    material.normalized_description = result.normalized_description
    material.canonical_description = result.canonical_description
    material.material_type = result.material_type
    material.material_group = result.material_group
    material.material_dna = result.material_dna
    material.normalization_status = result.normalization_status
    material.normalized_at = datetime.now(timezone.utc)

    # Clean old attributes for idempotency
    db.query(MaterialAttribute).filter(MaterialAttribute.material_id == material.id).delete()

    # Insert newly extracted structured attributes
    for attr in result.attributes:
        db_attr = MaterialAttribute(
            material_id=material.id,
            attribute_name=attr.name,
            raw_value=attr.raw_value,
            normalized_value=attr.normalized_value,
            normalized_unit=attr.normalized_unit,
            confidence_score=attr.confidence,
            extraction_method=attr.method,
        )
        db.add(db_attr)

    if commit:
        db.commit()
        db.refresh(material)

    return material


def batch_normalize_materials(
    db: Session,
    cpse_id: Optional[int] = None,
    uploaded_file_id: Optional[int] = None,
    limit: Optional[int] = None,
    chunk_size: int = 100,
) -> Dict[str, Any]:
    """
    Executes batch normalization across arbitrary dataset sizes.
    Processes in chunks to prevent database transaction bloat and memory pressure.
    Catches per-record errors without halting the overall batch.
    """
    query = db.query(Material)

    if cpse_id:
        query = query.filter(Material.cpse_id == cpse_id)
    if uploaded_file_id:
        query = query.filter(Material.uploaded_file_id == uploaded_file_id)

    if limit:
        query = query.limit(limit)

    total_count = query.count()
    if total_count == 0:
        return {
            "total_processed": 0,
            "normalized_count": 0,
            "review_required_count": 0,
            "failed_count": 0,
            "message": "No materials found to normalize.",
        }

    # Create a processing job record for observability
    job = ProcessingJob(
        uploaded_file_id=uploaded_file_id,
        job_type="NORMALIZATION",
        status="PROCESSING",
        total_records=total_count,
        processed_records=0,
        successful_records=0,
        failed_records=0,
        started_at=datetime.now(timezone.utc),
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    normalized_cnt = 0
    review_cnt = 0
    failed_cnt = 0
    processed_cnt = 0

    materials = query.all()

    for i in range(0, len(materials), chunk_size):
        chunk = materials[i : i + chunk_size]
        for mat in chunk:
            try:
                normalize_material_record(mat, db, commit=False)
                if mat.normalization_status == "NORMALIZED":
                    normalized_cnt += 1
                elif mat.normalization_status == "REVIEW_REQUIRED":
                    review_cnt += 1
                else:
                    failed_cnt += 1
            except Exception as e:
                mat.normalization_status = "FAILED"
                failed_cnt += 1
            processed_cnt += 1

        # Commit chunk
        db.commit()

        # Update job progress
        job.processed_records = processed_cnt
        job.successful_records = normalized_cnt + review_cnt
        job.failed_records = failed_cnt
        db.commit()

    # Finalize job
    job.status = "COMPLETED"
    job.completed_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "total_processed": processed_cnt,
        "normalized_count": normalized_cnt,
        "review_required_count": review_cnt,
        "failed_count": failed_cnt,
        "job_id": job.id,
        "message": f"Successfully processed {processed_cnt} materials ({normalized_cnt} normalized, {review_cnt} review required, {failed_cnt} failed).",
    }
