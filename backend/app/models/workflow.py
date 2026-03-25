import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.database import Base
from app.db.types import GUID

class VisibilityEnum(str, enum.Enum):
    PRIVATE = "PRIVATE"
    ORGANISATION = "ORGANISATION"
    PUBLIC = "PUBLIC"

class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(128), nullable=False)
    description = Column(Text)
    organisation_id = Column(GUID(), ForeignKey("organisations.id"), nullable=True)
    created_by = Column(GUID(), ForeignKey("users.id"), nullable=False)
    visibility = Column(Enum(VisibilityEnum), nullable=False, default=VisibilityEnum.PRIVATE)
    created_at = Column(DateTime, default=datetime.utcnow)

    organisation = relationship("Organisation", back_populates="workflows")
    incidents = relationship("Incident", back_populates="workflow")
