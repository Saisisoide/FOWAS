from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime
from app.models.workflow import VisibilityEnum

class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    organisation_id: Optional[UUID] = None
    visibility: VisibilityEnum = VisibilityEnum.PRIVATE

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    visibility: Optional[VisibilityEnum] = None

class WorkflowOut(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    organisation_id: Optional[UUID]
    created_by: UUID
    visibility: VisibilityEnum
    created_at: datetime

    class Config:
        from_attributes = True