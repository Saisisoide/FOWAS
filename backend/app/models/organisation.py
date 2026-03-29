import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base
from app.db.types import GUID

class Organisation(Base):
    __tablename__ = "organisations"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(128), nullable=False)
    created_by = Column(GUID(), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    memberships = relationship("OrganisationMembership", back_populates="organisation")
    workflows = relationship("Workflow", back_populates="organisation")
