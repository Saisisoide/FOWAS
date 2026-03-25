import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum, SmallInteger, CheckConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.database import Base
from app.models.tag import incident_tags
from app.db.types import GUID

class SeverityEnum(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class StatusEnum(str, enum.Enum):
    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    RESOLVED = "RESOLVED"

class IncidentVisibilityEnum(str, enum.Enum):
    PRIVATE = "PRIVATE"
    ORGANISATION = "ORGANISATION"
    PUBLIC = "PUBLIC"

class CategoryEnum(str, enum.Enum):
    TECHNICAL = "TECHNICAL"
    OPERATIONAL = "OPERATIONAL"
    HUMAN = "HUMAN"
    EXTERNAL = "EXTERNAL"
    SYSTEMIC = "SYSTEMIC"

class Incident(Base):
    __tablename__ = "incidents"
    __table_args__ = (
        CheckConstraint("impact >= 1 AND impact <= 10", name="impact_range"),
        CheckConstraint("resolved_at IS NULL OR resolved_at >= created_at", name="resolved_after_created"),
        CheckConstraint("linked_to != id", name="no_self_link"),
    )

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(GUID(), ForeignKey("workflows.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    severity = Column(Enum(SeverityEnum), nullable=False)
    impact = Column(SmallInteger, nullable=False)
    engineer = Column(String(128))
    main_category = Column(Enum(CategoryEnum), nullable=False)
    sub_category = Column(String(64), nullable=False)
    notes = Column(Text)
    linked_to = Column(GUID(), ForeignKey("incidents.id"), nullable=True)
    status = Column(Enum(StatusEnum), nullable=False, default=StatusEnum.OPEN)
    visibility = Column(Enum(IncidentVisibilityEnum), nullable=False, default=IncidentVisibilityEnum.ORGANISATION)
    created_by = Column(GUID(), ForeignKey("users.id"), nullable=False)
    assigned_to = Column(GUID(), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    resolved_at = Column(DateTime, nullable=True)

    workflow = relationship("Workflow", back_populates="incidents")
    creator = relationship("User", foreign_keys=[created_by], back_populates="incidents_created")
    tags = relationship("Tag", secondary=incident_tags, lazy="joined")
    cause_parent = relationship("Incident", remote_side="Incident.id", foreign_keys=[linked_to])
