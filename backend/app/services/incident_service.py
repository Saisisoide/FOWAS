from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from fastapi import HTTPException
from uuid import UUID
from datetime import datetime
from app.models.incident import Incident, StatusEnum, IncidentVisibilityEnum
from app.models.workflow import Workflow
from app.models.membership import OrganisationMembership, RoleEnum
from app.models.tag import Tag
from app.models.user import User
from app.schemas.incident import IncidentCreate, IncidentUpdate
from app.utils.risk_engine import compute_risk

# ------------------------------------------------------------------ #
#  Valid status transitions (per report Figure 5.1)                    #
# ------------------------------------------------------------------ #

VALID_TRANSITIONS = {
    StatusEnum.OPEN: {StatusEnum.INVESTIGATING},
    StatusEnum.INVESTIGATING: {StatusEnum.RESOLVED},
    StatusEnum.RESOLVED: {StatusEnum.OPEN},  # re-open
}


def validate_status_transition(current: StatusEnum, target: StatusEnum) -> None:
    """Raise 400 if the status transition is not allowed."""
    if target == current:
        return  # no-op is fine
    allowed = VALID_TRANSITIONS.get(current, set())
    if target not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition: {current.value} → {target.value}. "
            f"Allowed from {current.value}: {', '.join(s.value for s in allowed) or 'none'}.",
        )


# ------------------------------------------------------------------ #
#  RBAC — role-based permission check on incidents                     #
# ------------------------------------------------------------------ #

def _get_user_role_for_incident(db: Session, user: User, incident: Incident) -> RoleEnum | None:
    """Return the user's org role for the incident's workflow, or None."""
    workflow = db.query(Workflow).filter(Workflow.id == incident.workflow_id).first()
    if not workflow or not workflow.organisation_id:
        return None  # personal workflow — no org role
    membership = (
        db.query(OrganisationMembership)
        .filter_by(organisation_id=workflow.organisation_id, user_id=user.id)
        .first()
    )
    return membership.role if membership else None


def check_incident_permission(
    db: Session, user: User, incident: Incident, action: str = "edit"
) -> None:
    """
    Enforce RBAC per report Table 3.6:
      - OWNER / ADMIN: edit any incident, delete any incident
      - MEMBER: edit own incidents only, cannot delete
      - VIEWER: cannot edit or delete
    For personal workflows (no org): only creator can edit/delete.
    """
    is_creator = str(incident.created_by) == str(user.id)
    role = _get_user_role_for_incident(db, user, incident)

    if action == "edit":
        if is_creator:
            return  # creator can always edit their own
        if role in (RoleEnum.OWNER, RoleEnum.ADMIN):
            return  # org admin/owner can edit any
        raise HTTPException(status_code=403, detail="Insufficient permissions to edit this incident")

    if action == "delete":
        if role in (RoleEnum.OWNER, RoleEnum.ADMIN):
            return
        if is_creator and role is None:
            return  # personal workflow, creator can delete
        raise HTTPException(status_code=403, detail="Insufficient permissions to delete this incident")

    raise HTTPException(status_code=403, detail="Unknown action")


# ------------------------------------------------------------------ #
#  Visibility filter (unchanged)                                       #
# ------------------------------------------------------------------ #

def apply_visibility_filter(db: Session, user: User, query):
    user_org_ids = [m.organisation_id for m in user.memberships]
    return query.filter(
        or_(
            Incident.visibility == IncidentVisibilityEnum.PUBLIC,
            and_(
                Incident.visibility == IncidentVisibilityEnum.ORGANISATION,
                Incident.workflow.has(Workflow.organisation_id.in_(user_org_ids))
            ),
            and_(
                Incident.visibility == IncidentVisibilityEnum.PRIVATE,
                Incident.created_by == user.id
            )
        )
    )


# ------------------------------------------------------------------ #
#  Tag helper (unchanged)                                              #
# ------------------------------------------------------------------ #

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


# ------------------------------------------------------------------ #
#  Create incident (unchanged)                                         #
# ------------------------------------------------------------------ #

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


# ------------------------------------------------------------------ #
#  Update incident (now with status transition validation)             #
# ------------------------------------------------------------------ #

def update_incident(db: Session, incident_id: UUID, data: IncidentUpdate, user: User) -> Incident:
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Validate status transition if status is being changed
    if data.status is not None:
        validate_status_transition(incident.status, data.status)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(incident, field, value)

    if data.status == StatusEnum.RESOLVED and not incident.resolved_at:
        incident.resolved_at = datetime.utcnow()
    elif data.status and data.status != StatusEnum.RESOLVED:
        incident.resolved_at = None

    db.commit()
    db.refresh(incident)
    return incident


# ------------------------------------------------------------------ #
#  Enrich with risk (unchanged)                                        #
# ------------------------------------------------------------------ #

def enrich_with_risk(incident: Incident) -> dict:
    result = compute_risk(incident.severity.value, incident.impact)
    d = {c.key: getattr(incident, c.key) for c in incident.__table__.columns}
    d["tags"] = incident.tags
    d["risk_score"] = result.score
    d["risk_level"] = result.level.value
    return d
