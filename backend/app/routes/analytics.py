from fastapi import APIRouter, Depends, Query
from typing import Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.incident import SeverityEnum
from app.services.analytics_service import (
    get_summary, get_trend, get_severity_breakdown,
    get_risk_distribution, get_workflow_risk
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
def summary(
    workflow_id: Optional[UUID] = Query(None),
    severity: Optional[SeverityEnum] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return get_summary(db, user, workflow_id, severity, date_from, date_to)


@router.get("/trend")
def trend(
    days: int = Query(30),
    workflow_id: Optional[UUID] = Query(None),
    severity: Optional[SeverityEnum] = Query(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return get_trend(db, user, days, workflow_id, severity)


@router.get("/severity")
def severity(
    workflow_id: Optional[UUID] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return get_severity_breakdown(db, user, workflow_id, date_from, date_to)


@router.get("/risk-distribution")
def risk_dist(
    workflow_id: Optional[UUID] = Query(None),
    severity: Optional[SeverityEnum] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return get_risk_distribution(db, user, workflow_id, severity, date_from, date_to)


@router.get("/workflow-risk")
def workflow_risk(
    severity: Optional[SeverityEnum] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return get_workflow_risk(db, user, severity, date_from, date_to)
