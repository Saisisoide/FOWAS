import uuid
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base
from app.db.types import GUID

class User(Base):
    __tablename__ = "users"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    memberships = relationship("OrganisationMembership", back_populates="user")
    incidents_created = relationship("Incident", foreign_keys="Incident.created_by", back_populates="creator")
