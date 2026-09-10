import math
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, desc, asc
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List

from app.database.session import get_db
from app.models.user import User
from app.models.material import Material
from app.models.material_attribute import MaterialAttribute
from app.models.uploaded_file import UploadedFile
from app.models.material_mapping import MaterialMapping
from app.schemas.ingestion import (
    MaterialResponse,
    MaterialDetailResponse,
    MaterialAttributeResponse,
    PaginatedMaterialsResponse,
    BatchNormalizeRequest,
    BatchNormalizeResponse,
)
from app.api.deps import get_current_active_user, enforce_cpse_access
from app.services.normalization_service import normalize_material_record, batch_normalize_materials

router = APIRouter(prefix="/materials", tags=["Raw Material Explorer & Material DNA"])


@router.get("", response_model=PaginatedMaterialsResponse)
def list_materials(
    q: Optional[str] = Query(None, description="Search by material code or raw description"),
    uploaded_file_id: Optional[int] = Query(None, description="Filter by source dataset ID"),
    uom: Optional[str] = Query(None, description="Filter by Unit of Measure"),
    normalization_status: Optional[str] = Query(None, description="Filter by normalization status (RAW, NORMALIZED, REVIEW_REQUIRED, FAILED)"),
    material_type: Optional[str] = Query(None, description="Filter by material type (PIPE, VALVE, FLANGE, etc.)"),
    material_group: Optional[str] = Query(None, description="Filter by material group (PIPING, VALVES, etc.)"),
    target_cpse_id: Optional[int] = Query(None, description="Filter by CPSE (Super Admin only)"),
    sort_by: str = Query("created_at", description="Field to sort by: created_at, material_code, order_qty"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Server-side search, filtering, sorting, and pagination for raw and normalized materials.
    Includes Phase 3 classification and normalization status filters.
    """
    user_role = current_user.role.name if current_user.role else "USER"
    query = db.query(Material).options(joinedload(Material.cpse), joinedload(Material.uploaded_file))

    # Tenant scoping
    if user_role not in ["SUPER_ADMIN", "MATERIAL_EXPERT", "PROCUREMENT_ANALYST"]:
        query = query.filter(Material.cpse_id == current_user.cpse_id)
    elif target_cpse_id:
        query = query.filter(Material.cpse_id == target_cpse_id)

    # Search filter (Material Code or Raw Description)
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Material.material_code.ilike(term),
                Material.raw_description.ilike(term),
                Material.canonical_description.ilike(term),
            )
        )

    # Dataset filter
    if uploaded_file_id:
        query = query.filter(Material.uploaded_file_id == uploaded_file_id)

    # UOM filter
    if uom and uom.strip():
        query = query.filter(Material.uom == uom.strip().upper())

    # Normalization Status filter
    if normalization_status and normalization_status.strip():
        query = query.filter(Material.normalization_status == normalization_status.strip().upper())

    # Material Type filter
    if material_type and material_type.strip():
        query = query.filter(Material.material_type == material_type.strip().upper())

    # Material Group filter
    if material_group and material_group.strip():
        query = query.filter(Material.material_group == material_group.strip().upper())

    # Total count
    total = query.count()

    # Sorting
    sort_col = getattr(Material, sort_by, Material.created_at)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    # Pagination
    offset = (page - 1) * page_size
    materials = query.offset(offset).limit(page_size).all()

    items = [
        MaterialResponse(
            id=m.id,
            cpse_id=m.cpse_id,
            cpse_code=m.cpse.code if m.cpse else None,
            uploaded_file_id=m.uploaded_file_id,
            file_name=m.uploaded_file.file_name if m.uploaded_file else None,
            source_row_number=m.source_row_number,
            material_code=m.material_code,
            raw_description=m.raw_description,
            order_qty=m.order_qty,
            uom=m.uom,
            status=m.status,
            normalization_status=m.normalization_status or "RAW",
            material_type=m.material_type,
            material_group=m.material_group,
            normalized_description=m.normalized_description,
            canonical_description=m.canonical_description,
            normalized_at=m.normalized_at,
            created_at=m.created_at,
        )
        for m in materials
    ]

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return PaginatedMaterialsResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{material_id}", response_model=MaterialDetailResponse)
def get_material_details(
    material_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves full details of a single material record.
    Provides two distinct sections:
    1. SOURCE / RAW DATA: Preserves raw_description and original codes exactly.
    2. CANONIX INTELLIGENCE: Material DNA, canonical description, and structured attributes.
    """
    material = (
        db.query(Material)
        .options(
            joinedload(Material.cpse),
            joinedload(Material.uploaded_file),
            joinedload(Material.attributes),
        )
        .filter(Material.id == material_id)
        .first()
    )

    if not material:
        raise HTTPException(status_code=404, detail="Material record not found.")

    # Enforce tenant isolation for CPSE users
    user_role = current_user.role.name if current_user.role else "USER"
    if user_role not in ["SUPER_ADMIN", "MATERIAL_EXPERT", "PROCUREMENT_ANALYST"]:
        enforce_cpse_access(material.cpse_id, current_user)

    mapping = db.query(MaterialMapping).filter(MaterialMapping.material_id == material.id).first()
    national_mapping_info = None
    if mapping and mapping.national_material:
        national_mapping_info = {
            "id": mapping.id,
            "national_material_id": mapping.national_material_id,
            "national_material_code": mapping.national_material.national_material_code,
            "canonical_description": mapping.national_material.canonical_description,
            "mapping_type": mapping.mapping_type,
            "confidence_score": mapping.confidence_score,
            "status": mapping.status,
            "notes": mapping.notes,
        }

    return MaterialDetailResponse(
        id=material.id,
        cpse_id=material.cpse_id,
        cpse_code=material.cpse.code if material.cpse else None,
        cpse_name=material.cpse.name if material.cpse else None,
        uploaded_file_id=material.uploaded_file_id,
        file_name=material.uploaded_file.file_name if material.uploaded_file else None,
        source_row_number=material.source_row_number,
        material_code=material.material_code,
        raw_description=material.raw_description,
        order_qty=material.order_qty,
        uom=material.uom,
        status=material.status,
        normalization_status=material.normalization_status or "RAW",
        material_type=material.material_type,
        material_group=material.material_group,
        normalized_description=material.normalized_description,
        canonical_description=material.canonical_description,
        material_dna=material.material_dna,
        normalized_at=material.normalized_at,
        created_at=material.created_at,
        national_mapping=national_mapping_info,
        attributes=[
            MaterialAttributeResponse(
                id=a.id,
                attribute_name=a.attribute_name,
                raw_value=a.raw_value,
                normalized_value=a.normalized_value,
                normalized_unit=a.normalized_unit,
                confidence_score=a.confidence_score,
                extraction_method=a.extraction_method,
            )
            for a in material.attributes
        ],
    )


@router.post("/{material_id}/normalize", response_model=MaterialDetailResponse)
def normalize_single_material_endpoint(
    material_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Triggers or re-runs the deterministic normalization pipeline on a single material record.
    Generates Material DNA, extracted attributes, and canonical description without overwriting raw_description.
    """
    material = (
        db.query(Material)
        .options(joinedload(Material.cpse), joinedload(Material.uploaded_file))
        .filter(Material.id == material_id)
        .first()
    )

    if not material:
        raise HTTPException(status_code=404, detail="Material record not found.")

    user_role = current_user.role.name if current_user.role else "USER"
    if user_role not in ["SUPER_ADMIN", "MATERIAL_EXPERT"]:
        enforce_cpse_access(material.cpse_id, current_user)

    updated_material = normalize_material_record(material, db, commit=True)
    return get_material_details(material_id=updated_material.id, current_user=current_user, db=db)


@router.post("/normalize", response_model=BatchNormalizeResponse)
def batch_normalize_materials_endpoint(
    payload: Optional[BatchNormalizeRequest] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Executes batch normalization across an arbitrary dataset size.
    Non-blocking, chunked database processing with failure containment.
    """
    user_role = current_user.role.name if current_user.role else "USER"

    cpse_id = None
    if user_role not in ["SUPER_ADMIN", "MATERIAL_EXPERT"]:
        cpse_id = current_user.cpse_id

    uploaded_file_id = payload.uploaded_file_id if payload else None
    limit = payload.limit if payload else None

    result = batch_normalize_materials(
        db=db,
        cpse_id=cpse_id,
        uploaded_file_id=uploaded_file_id,
        limit=limit,
    )

    return BatchNormalizeResponse(
        total_processed=result["total_processed"],
        normalized_count=result["normalized_count"],
        review_required_count=result["review_required_count"],
        failed_count=result["failed_count"],
        message=result["message"],
        job_id=result.get("job_id"),
    )
