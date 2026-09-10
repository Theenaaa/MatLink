from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.core.security import verify_password, create_access_token
from app.api.deps import (
    get_current_active_user,
    require_super_admin,
    require_cpse_admin,
    require_material_expert,
    require_procurement_analyst,
    enforce_cpse_access,
)

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user via email & password, returning JWT access token with role and CPSE context.
    """
    user = (
        db.query(User)
        .options(joinedload(User.role), joinedload(User.cpse))
        .filter(User.email == request.email)
        .first()
    )

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated. Contact system administrator.",
        )

    # Update last login timestamp
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    role_name = user.role.name if user.role else "USER"
    cpse_code = user.cpse.code if user.cpse else None

    access_token = create_access_token(
        subject=str(user.id),
        role=role_name,
        cpse_id=cpse_code,
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    """
    Retrieve authenticated user profile and permissions.
    """
    return UserResponse.model_validate(current_user)


# Role-verification endpoints for testing & frontend checks
@router.get("/verify/super-admin")
def verify_super_admin_role(user: User = Depends(require_super_admin)):
    return {"status": "authorized", "role": user.role.name, "user": user.email}


@router.get("/verify/cpse-admin")
def verify_cpse_admin_role(user: User = Depends(require_cpse_admin)):
    return {"status": "authorized", "role": user.role.name, "cpse": user.cpse.code if user.cpse else None}


@router.get("/verify/material-expert")
def verify_material_expert_role(user: User = Depends(require_material_expert)):
    return {"status": "authorized", "role": user.role.name, "user": user.email}


@router.get("/verify/procurement-analyst")
def verify_procurement_analyst_role(user: User = Depends(require_procurement_analyst)):
    return {"status": "authorized", "role": user.role.name, "user": user.email}


@router.get("/verify/tenant-access/{target_cpse}")
def verify_tenant_isolation(
    target_cpse: str,
    user: User = Depends(get_current_active_user),
):
    """
    Verifies that the caller has access to the specified CPSE data.
    Raises 403 if crossing tenant boundary without SUPER_ADMIN.
    """
    enforce_cpse_access(target_cpse, user)
    return {
        "status": "access_granted",
        "user_email": user.email,
        "user_role": user.role.name,
        "user_cpse": user.cpse.code if user.cpse else "ALL",
        "target_cpse": target_cpse,
    }
