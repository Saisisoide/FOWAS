import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.database import Base
from app.db.types import GUID

class RoleEnum(str, enum.Enum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"
    VIEWER = "VIEWER"

class OrganisationMembership(Base):
    __tablename__ = "organisation_memberships"
    __table_args__ = (UniqueConstraint("user_id", "organisation_id"),)

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    organisation_id = Column(GUID(), ForeignKey("organisations.id"), nullable=False)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)

    organisation = relationship("Organisation", back_populates="memberships")
    user = relationship("User", back_populates="memberships")
