from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from app.schemas.auth import RoleResponse, CPSEResponse


class CreateCPSEAdminRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    cpse_id: int


class CreateUserRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role_name: str  # CPSE_ADMIN, MATERIAL_EXPERT, PROCUREMENT_ANALYST
    cpse_id: Optional[int] = None


class CreateCPSERequest(BaseModel):
    code: str
    name: str
    status: str = "ACTIVE"


class UserStatusUpdateRequest(BaseModel):
    is_active: bool


class UserListItemResponse(BaseModel):
    id: int
    name: str
    email: str
    is_active: bool
    role: RoleResponse
    cpse: Optional[CPSEResponse] = None
    last_login_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

