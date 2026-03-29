from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from app.models.membership import RoleEnum

class OrgCreate(BaseModel):
    name: str

class OrgOut(BaseModel):
    id: UUID
    name: str
    created_by: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class InviteRequest(BaseModel):
    email: EmailStr
    role: RoleEnum = RoleEnum.MEMBER

class UpdateRoleRequest(BaseModel):
    role: RoleEnum

class MembershipOut(BaseModel):
    user_id: UUID
    role: RoleEnum
    joined_at: datetime

    class Config:
        from_attributes = True