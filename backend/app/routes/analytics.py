from fastapi import APIRouter, Depends, Query
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.services.analytics_service import (
    get_summary, get_trend, get_severity_breakdown,
    get_risk_distribution, get_workflow_risk
)

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/summary")
def summary(workflow_id: Optional[UUID] = Query(None), db: Session = Depends(get_db), user=Depends(get_current_user)):
    return get_summary(db, user, workflow_id)

@router.get("/trend")
def trend(days: int = Query(30), db: Session = Depends(get_db), user=Depends(get_current_user)):
    return get_trend(db, user, days)

@router.get("/severity")
def severity(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return get_severity_breakdown(db, user)

@router.get("/risk-distribution")
def risk_dist(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return get_risk_distribution(db, user)

@router.get("/workflow-risk")
def workflow_risk(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return get_workflow_risk(db, user)