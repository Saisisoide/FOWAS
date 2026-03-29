import uuid
from sqlalchemy import Column, String, Table, ForeignKey
from app.db.database import Base
from app.db.types import GUID

incident_tags = Table(
    "incident_tags",
    Base.metadata,
    Column("incident_id", GUID(), ForeignKey("incidents.id"), primary_key=True),
    Column("tag_id", GUID(), ForeignKey("tags.id"), primary_key=True),
)

class Tag(Base):
    __tablename__ = "tags"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(64), unique=True, nullable=False, index=True)
