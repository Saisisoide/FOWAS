from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional, List
from datetime import datetime
from app.models.incident import SeverityEnum, StatusEnum, IncidentVisibilityEnum, CategoryEnum

class IncidentCreate(BaseModel):
    workflow_id: UUID
    title: str = Field(..., min_length=3, max_length=255)
    severity: SeverityEnum
    impact: int = Field(..., ge=1, le=10)
    engineer: Optional[str] = None
    main_category: CategoryEnum
    sub_category: str
    tags: List[str] = []
    notes: Optional[str] = None
    linked_to: Optional[UUID] = None
    visibility: IncidentVisibilityEnum = IncidentVisibilityEnum.ORGANISATION

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    severity: Optional[SeverityEnum] = None
    impact: Optional[int] = Field(None, ge=1, le=10)
    status: Optional[StatusEnum] = None
    engineer: Optional[str] = None
    notes: Optional[str] = None
    visibility: Optional[IncidentVisibilityEnum] = None
    assigned_to: Optional[UUID] = None

class TagOut(BaseModel):
    id: UUID
    name: str

    class Config:
        from_attributes = True

class IncidentOut(BaseModel):
    id: UUID
    workflow_id: UUID
    title: str
    severity: SeverityEnum
    impact: int
    engineer: Optional[str]
    main_category: CategoryEnum
    sub_category: str
    notes: Optional[str]
    linked_to: Optional[UUID]
    status: StatusEnum
    visibility: IncidentVisibilityEnum
    created_by: UUID
    assigned_to: Optional[UUID]
    created_at: datetime
    resolved_at: Optional[datetime]
    tags: List[TagOut] = []
    risk_score: Optional[int] = None
    risk_level: Optional[str] = None

    class Config:
        from_attributes = True