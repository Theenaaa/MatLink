from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.models.user import User
from app.models.role import Role
from app.models.cpse import CPSE
from app.schemas.users import (
    CreateCPSEAdminRequest,
    CreateUserRequest,
    UserStatusUpdateRequest,
    UserListItemResponse,
)
from app.core.security import get_password_hash
from app.api.deps import (
    get_current_active_user,
    require_super_admin,
    require_cpse_admin,
    enforce_cpse_access,
)

router = APIRouter(prefix="/users", tags=["User & Tenant Role Administration"])


@router.post("/cpse-admin", response_model=UserListItemResponse, status_code=status.HTTP_201_CREATED)
def create_cpse_admin(
    request: CreateCPSEAdminRequest,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """
    SUPER ADMIN ONLY: Create a new CPSE Admin account assigned to a specific CPSE.
    """
    email_clean = request.email.strip().lower()
    
    # 1. Check if email exists
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{email_clean}' already exists.",
        )

    # 2. Check CPSE existence
    cpse = db.query(CPSE).filter(CPSE.id == request.cpse_id).first()
    if not cpse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"CPSE enterprise with ID {request.cpse_id} not found.",
        )

    # 3. Get CPSE_ADMIN role
    role = db.query(Role).filter(Role.name == "CPSE_ADMIN").first()
    if not role:
        role = Role(name="CPSE_ADMIN", description="Enterprise CPSE Administrator")
        db.add(role)
        db.flush()

    # 4. Create user
    new_admin = User(
        name=request.name.strip(),
        email=email_clean,
        password_hash=get_password_hash(request.password),
        role_id=role.id,
        cpse_id=cpse.id,
        is_active=True,
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    # Reload with relationships
    res = (
        db.query(User)
        .options(joinedload(User.role), joinedload(User.cpse))
        .filter(User.id == new_admin.id)
        .first()
    )
    return UserListItemResponse.model_validate(res)


@router.post("", response_model=UserListItemResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    request: CreateUserRequest,
    current_user: User = Depends(require_cpse_admin),
    db: Session = Depends(get_db),
):
    """
    Create a team member user (CPSE_ADMIN, MATERIAL_EXPERT, PROCUREMENT_ANALYST).
    CPSE Admins are restricted to creating users within their own CPSE tenant.
    """
    caller_role = current_user.role.name if current_user.role else ""
    email_clean = request.email.strip().lower()

    # Prevent non-Super Admin from creating SUPER_ADMIN users
    if request.role_name.upper() == "SUPER_ADMIN" and caller_role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admin can create Super Admin accounts.",
        )

    # Email uniqueness check
    if db.query(User).filter(User.email == email_clean).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{email_clean}' already exists.",
        )

    # Determine CPSE ID
    if caller_role == "SUPER_ADMIN":
        if not request.cpse_id and request.role_name.upper() != "SUPER_ADMIN":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CPSE ID is required when creating an enterprise role.",
            )
        target_cpse_id = request.cpse_id
    else:
        # CPSE Admin creates user for their own tenant
        target_cpse_id = current_user.cpse_id

    # Verify role object
    role_name_clean = request.role_name.strip().upper()
    role = db.query(Role).filter(Role.name == role_name_clean).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{role_name_clean}'. Valid roles: CPSE_ADMIN, MATERIAL_EXPERT, PROCUREMENT_ANALYST",
        )

    new_user = User(
        name=request.name.strip(),
        email=email_clean,
        password_hash=get_password_hash(request.password),
        role_id=role.id,
        cpse_id=target_cpse_id,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    res = (
        db.query(User)
        .options(joinedload(User.role), joinedload(User.cpse))
        .filter(User.id == new_user.id)
        .first()
    )
    return UserListItemResponse.model_validate(res)


@router.get("", response_model=List[UserListItemResponse])
def list_users(
    cpse_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    List user accounts.
    SUPER_ADMIN sees all users or filters by cpse_id.
    CPSE Users strictly see users within their own CPSE tenant.
    """
    caller_role = current_user.role.name if current_user.role else ""
    query = db.query(User).options(joinedload(User.role), joinedload(User.cpse))

    if caller_role == "SUPER_ADMIN":
        if cpse_id is not None:
            query = query.filter(User.cpse_id == cpse_id)
    else:
        # Enforce multi-tenant filter
        query = query.filter(User.cpse_id == current_user.cpse_id)

    users = query.order_by(User.created_at.desc()).all()
    return [UserListItemResponse.model_validate(u) for u in users]


@router.patch("/{user_id}/status", response_model=UserListItemResponse)
def toggle_user_status(
    user_id: int,
    request: UserStatusUpdateRequest,
    current_user: User = Depends(require_cpse_admin),
    db: Session = Depends(get_db),
):
    """
    Activate or Deactivate a user account. Enforces tenant isolation boundaries.
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    caller_role = current_user.role.name if current_user.role else ""

    # Prevent changing Super Admin status if not Super Admin
    target_role = target_user.role.name if target_user.role else ""
    if target_role == "SUPER_ADMIN" and caller_role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify Super Admin account status.",
        )

    # Multi-tenant isolation check
    if target_user.cpse_id:
        enforce_cpse_access(target_user.cpse_id, current_user)

    target_user.is_active = request.is_active
    db.commit()

    res = (
        db.query(User)
        .options(joinedload(User.role), joinedload(User.cpse))
        .filter(User.id == user_id)
        .first()
    )
    return UserListItemResponse.model_validate(res)
