from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from datetime import datetime
from app.core.dependencies import get_db, get_current_user
from app.models.incident import Incident, SeverityEnum, StatusEnum, CategoryEnum
from app.models.tag import Tag
from app.schemas.incident import IncidentCreate, IncidentUpdate, IncidentOut, IncidentListResponse
from app.services.incident_service import (
    create_incident, update_incident, apply_visibility_filter, enrich_with_risk,
    check_incident_permission,
)

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.post("", response_model=IncidentOut)
def log_incident(data: IncidentCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    incident = create_incident(db, data, user)
    return enrich_with_risk(incident)


@router.get("", response_model=IncidentListResponse)
def list_incidents(
    severity: Optional[SeverityEnum] = Query(None, description="Filter by severity"),
    status: Optional[StatusEnum] = Query(None, description="Filter by status"),
    workflow_id: Optional[UUID] = Query(None, description="Filter by workflow"),
    main_category: Optional[CategoryEnum] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search title, subcategory, engineer"),
    tag: Optional[str] = Query(None, description="Filter by tag name"),
    date_from: Optional[datetime] = Query(None, description="Incidents created after this datetime"),
    date_to: Optional[datetime] = Query(None, description="Incidents created before this datetime"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(200, ge=1, le=500, description="Max results per page"),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    query = apply_visibility_filter(db, user, db.query(Incident))

    if severity:
        query = query.filter(Incident.severity == severity)
    if status:
        query = query.filter(Incident.status == status)
    if workflow_id:
        query = query.filter(Incident.workflow_id == workflow_id)
    if main_category:
        query = query.filter(Incident.main_category == main_category)
    if date_from:
        query = query.filter(Incident.created_at >= date_from)
    if date_to:
        query = query.filter(Incident.created_at <= date_to)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            Incident.title.ilike(term)
            | Incident.sub_category.ilike(term)
            | Incident.engineer.ilike(term)
        )
    if tag:
        query = query.join(Incident.tags).filter(Tag.name == tag.strip().lower())

    total = query.count()
    incidents = query.order_by(Incident.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "items": [enrich_with_risk(i) for i in incidents],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(incident_id: UUID, db: Session = Depends(get_db), user=Depends(get_current_user)):
    query = apply_visibility_filter(db, user, db.query(Incident))
    incident = query.filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Not found")
    return enrich_with_risk(incident)


@router.patch("/{incident_id}", response_model=IncidentOut)
def patch_incident(incident_id: UUID, data: IncidentUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    check_incident_permission(db, user, incident, action="edit")
    updated = update_incident(db, incident_id, data, user)
    return enrich_with_risk(updated)


@router.delete("/{incident_id}")
def delete_incident(incident_id: UUID, db: Session = Depends(get_db), user=Depends(get_current_user)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Not found")
    check_incident_permission(db, user, incident, action="delete")
    db.delete(incident)
    db.commit()
    return {"detail": "Deleted"}
