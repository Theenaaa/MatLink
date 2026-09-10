from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.cpse import CPSE
from app.models.user import User
from app.schemas.auth import CPSEResponse
from app.schemas.users import CreateCPSERequest
from app.api.deps import get_current_active_user, require_super_admin

router = APIRouter(prefix="/cpse", tags=["CPSE Enterprise Management"])


@router.get("", response_model=List[CPSEResponse])
def list_cpses(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve list of all registered CPSE enterprises.
    """
    cpses = db.query(CPSE).order_by(CPSE.code.asc()).all()
    return [CPSEResponse.model_validate(c) for c in cpses]


@router.post("", response_model=CPSEResponse, status_code=status.HTTP_201_CREATED)
def create_cpse(
    request: CreateCPSERequest,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """
    Create a new Central Public Sector Enterprise (CPSE) entity.
    Super Admin privilege required.
    """
    code_clean = request.code.strip().upper()
    existing = db.query(CPSE).filter(CPSE.code == code_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"CPSE with code '{code_clean}' already exists.",
        )

    cpse = CPSE(
        code=code_clean,
        name=request.name.strip(),
        status=request.status.strip().upper(),
    )
    db.add(cpse)
    db.commit()
    db.refresh(cpse)
    return CPSEResponse.model_validate(cpse)

