from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.core.dependencies import get_db, get_current_user
from app.models.incident import Incident
from app.schemas.incident import IncidentCreate, IncidentUpdate, IncidentOut
from app.services.incident_service import (
    create_incident, update_incident, apply_visibility_filter, enrich_with_risk
)

router = APIRouter(prefix="/incidents", tags=["incidents"])

@router.post("", response_model=IncidentOut)
def log_incident(data: IncidentCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    incident = create_incident(db, data, user)
    enriched = enrich_with_risk(incident)
    return enriched

@router.get("", response_model=list[IncidentOut])
def list_incidents(db: Session = Depends(get_db), user=Depends(get_current_user)):
    query = apply_visibility_filter(db, user, db.query(Incident))
    incidents = query.order_by(Incident.created_at.desc()).all()
    return [enrich_with_risk(i) for i in incidents]

@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(incident_id: UUID, db: Session = Depends(get_db), user=Depends(get_current_user)):
    query = apply_visibility_filter(db, user, db.query(Incident))
    incident = query.filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Not found")
    return enrich_with_risk(incident)

@router.patch("/{incident_id}", response_model=IncidentOut)
def patch_incident(incident_id: UUID, data: IncidentUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    incident = update_incident(db, incident_id, data, user)
    return enrich_with_risk(incident)

@router.delete("/{incident_id}")
def delete_incident(incident_id: UUID, db: Session = Depends(get_db), user=Depends(get_current_user)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Not found")
    if str(incident.created_by) != str(user.id):
        raise HTTPException(status_code=403, detail="Not yours")
    db.delete(incident)
    db.commit()
    return {"detail": "Deleted"}