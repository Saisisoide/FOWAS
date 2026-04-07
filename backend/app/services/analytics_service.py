from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
from app.models.incident import Incident, StatusEnum, SeverityEnum
from app.models.user import User
from app.utils.risk_engine import compute_risk
from app.utils.reliability_metrics import compute_metrics
from app.services.incident_service import apply_visibility_filter


def _apply_analytics_filters(
    query,
    workflow_id: Optional[UUID] = None,
    severity: Optional[SeverityEnum] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
):
    """Shared filter logic for all analytics endpoints."""
    if workflow_id:
        query = query.filter(Incident.workflow_id == workflow_id)
    if severity:
        query = query.filter(Incident.severity == severity)
    if date_from:
        query = query.filter(Incident.created_at >= date_from)
    if date_to:
        query = query.filter(Incident.created_at <= date_to)
    return query


def get_summary(
    db: Session,
    user: User,
    workflow_id: Optional[UUID] = None,
    severity: Optional[SeverityEnum] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
):
    query = apply_visibility_filter(db, user, db.query(Incident))
    query = _apply_analytics_filters(query, workflow_id, severity, date_from, date_to)

    incidents = query.all()
    incident_dicts = [
        {"created_at": i.created_at, "resolved_at": i.resolved_at}
        for i in incidents
    ]
    metrics = compute_metrics(incident_dicts)

    high_risk = sum(
        1 for i in incidents
        if compute_risk(i.severity.value, i.impact).score > 15
    )

    return {
        "total_incidents": len(incidents),
        "open_incidents": sum(1 for i in incidents if i.status == StatusEnum.OPEN),
        "high_risk_count": high_risk,
        "resolved_count": sum(1 for i in incidents if i.status == StatusEnum.RESOLVED),
        "mttr_hours": metrics.mttr_hours,
        "mtbf_hours": metrics.mtbf_hours,
        "availability_ratio": metrics.availability_ratio,
    }


def get_trend(
    db: Session,
    user: User,
    days: int = 30,
    workflow_id: Optional[UUID] = None,
    severity: Optional[SeverityEnum] = None,
):
    query = apply_visibility_filter(db, user, db.query(Incident))
    since = datetime.utcnow() - timedelta(days=days)
    query = query.filter(Incident.created_at >= since)
    query = _apply_analytics_filters(query, workflow_id, severity)

    incidents = query.all()

    counts = {}
    for i in incidents:
        day = i.created_at.strftime("%Y-%m-%d")
        counts[day] = counts.get(day, 0) + 1

    return [{"date": k, "count": v} for k, v in sorted(counts.items())]


def get_severity_breakdown(
    db: Session,
    user: User,
    workflow_id: Optional[UUID] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
):
    query = apply_visibility_filter(db, user, db.query(Incident))
    query = _apply_analytics_filters(query, workflow_id, date_from=date_from, date_to=date_to)

    incidents = query.all()
    counts = {}
    for i in incidents:
        counts[i.severity.value] = counts.get(i.severity.value, 0) + 1
    return [{"severity": k, "count": v} for k, v in counts.items()]


def get_risk_distribution(
    db: Session,
    user: User,
    workflow_id: Optional[UUID] = None,
    severity: Optional[SeverityEnum] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
):
    query = apply_visibility_filter(db, user, db.query(Incident))
    query = _apply_analytics_filters(query, workflow_id, severity, date_from, date_to)

    incidents = query.all()
    buckets = {"LOW (1-5)": 0, "MODERATE (6-15)": 0, "HIGH (16-30)": 0}
    for i in incidents:
        score = compute_risk(i.severity.value, i.impact).score
        if score <= 5:
            buckets["LOW (1-5)"] += 1
        elif score <= 15:
            buckets["MODERATE (6-15)"] += 1
        else:
            buckets["HIGH (16-30)"] += 1
    return [{"range": k, "count": v} for k, v in buckets.items()]


def get_workflow_risk(
    db: Session,
    user: User,
    severity: Optional[SeverityEnum] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
):
    query = apply_visibility_filter(db, user, db.query(Incident))
    query = _apply_analytics_filters(query, severity=severity, date_from=date_from, date_to=date_to)

    incidents = query.all()

    workflow_data = {}
    for i in incidents:
        wid = str(i.workflow_id)
        score = compute_risk(i.severity.value, i.impact).score
        if wid not in workflow_data:
            workflow_data[wid] = {"name": i.workflow.name, "scores": []}
        workflow_data[wid]["scores"].append(score)

    return [
        {
            "workflow_name": v["name"],
            "avg_risk": round(sum(v["scores"]) / len(v["scores"]), 2),
            "incident_count": len(v["scores"]),
        }
        for v in workflow_data.values()
    ]
