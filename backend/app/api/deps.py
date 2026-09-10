from typing import Generator, Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.database.session import get_db
from app.models.user import User
from app.models.role import Role
from app.models.cpse import CPSE

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id_str: Optional[str] = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    user = (
        db.query(User)
        .options(joinedload(User.role), joinedload(User.cpse))
        .filter(User.id == user_id)
        .first()
    )
    if user is None:
        raise credentials_exception
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
    return current_user


def require_role(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        user_role = current_user.role.name if current_user.role else None
        if user_role not in allowed_roles and user_role != "SUPER_ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker


def require_super_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    user_role = current_user.role.name if current_user.role else None
    if user_role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin privileges required"
        )
    return current_user


def require_cpse_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    user_role = current_user.role.name if current_user.role else None
    if user_role not in ["CPSE_ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CPSE Admin privileges required"
        )
    return current_user


def require_material_expert(
    current_user: User = Depends(get_current_active_user)
) -> User:
    user_role = current_user.role.name if current_user.role else None
    if user_role not in ["MATERIAL_EXPERT", "SUPER_ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Material Expert privileges required"
        )
    return current_user


def require_procurement_analyst(
    current_user: User = Depends(get_current_active_user)
) -> User:
    user_role = current_user.role.name if current_user.role else None
    if user_role not in ["PROCUREMENT_ANALYST", "SUPER_ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Procurement Analyst privileges required"
        )
    return current_user


def enforce_cpse_access(target_cpse_id_or_code: str | int, current_user: User) -> bool:
    """
    CRITICAL TENANT ISOLATION CHECK:
    Ensures a CPSE user can NEVER query or mutate another CPSE's data.
    SUPER_ADMIN has universal access.
    """
    user_role = current_user.role.name if current_user.role else None
    if user_role == "SUPER_ADMIN":
        return True

    # For CPSE users, check against both cpse_id and cpse.code
    user_cpse_code = current_user.cpse.code if current_user.cpse else None
    user_cpse_id = current_user.cpse_id

    target_str = str(target_cpse_id_or_code).upper()

    if target_str == str(user_cpse_id) or (user_cpse_code and target_str == user_cpse_code.upper()):
        return True

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Access denied: Tenant isolation violation. CPSE user from '{user_cpse_code}' cannot access '{target_cpse_id_or_code}' data."
    )
