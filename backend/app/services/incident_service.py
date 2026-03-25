from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from fastapi import HTTPException
from uuid import UUID
from datetime import datetime
from app.models.incident import Incident, StatusEnum, IncidentVisibilityEnum
from app.models.workflow import Workflow
from app.models.tag import Tag
from app.models.user import User
from app.schemas.incident import IncidentCreate, IncidentUpdate
from app.utils.risk_engine import compute_risk

def apply_visibility_filter(db: Session, user: User, query):
    user_org_ids = [m.organisation_id for m in user.memberships]
    return query.filter(
        or_(
            Incident.visibility == "PUBLIC",
            and_(
                Incident.visibility == "ORGANISATION",
                Incident.workflow.has(Workflow.organisation_id.in_(user_org_ids))
            ),
            and_(
                Incident.visibility == "PRIVATE",
                Incident.created_by == user.id
            )
        )
    )

def get_or_create_tags(db: Session, tag_names: list) -> list:
    tags = []
    for name in tag_names:
        name = name.strip().lower()
        tag = db.query(Tag).filter(Tag.name == name).first()
        if not tag:
            tag = Tag(name=name)
            db.add(tag)
            db.flush()
        tags.append(tag)
    return tags

def create_incident(db: Session, data: IncidentCreate, user: User) -> Incident:
    workflow = db.query(Workflow).filter(Workflow.id == data.workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    visibility = data.visibility
    if workflow.organisation_id is None and str(data.visibility) == "ORGANISATION":
        visibility = IncidentVisibilityEnum.PRIVATE

    tags = get_or_create_tags(db, data.tags)
    incident = Incident(
        workflow_id=data.workflow_id,
        title=data.title,
        severity=data.severity,
        impact=data.impact,
        engineer=data.engineer,
        main_category=data.main_category,
        sub_category=data.sub_category,
        notes=data.notes,
        linked_to=data.linked_to,
        visibility=visibility,
        created_by=user.id,
        tags=tags,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident

def update_incident(db: Session, incident_id: UUID, data: IncidentUpdate, user: User) -> Incident:
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(incident, field, value)

    if data.status == StatusEnum.RESOLVED and not incident.resolved_at:
        incident.resolved_at = datetime.utcnow()
    elif data.status and data.status != StatusEnum.RESOLVED:
        incident.resolved_at = None

    db.commit()
    db.refresh(incident)
    return incident

def enrich_with_risk(incident: Incident) -> dict:
    result = compute_risk(incident.severity, incident.impact)
    d = {c.key: getattr(incident, c.key) for c in incident.__table__.columns}
    d["tags"] = incident.tags
    d["risk_score"] = result.score
    d["risk_level"] = result.level.value
    return d
