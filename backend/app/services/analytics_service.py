from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.models.incident import Incident, StatusEnum
from app.models.workflow import Workflow
from app.models.user import User
from app.utils.risk_engine import compute_risk
from app.utils.reliability_metrics import compute_metrics
from app.services.incident_service import apply_visibility_filter

def get_summary(db: Session, user: User, workflow_id=None):
    query = apply_visibility_filter(db, user, db.query(Incident))
    if workflow_id:
        query = query.filter(Incident.workflow_id == workflow_id)

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

def get_trend(db: Session, user: User, days: int = 30):
    query = apply_visibility_filter(db, user, db.query(Incident))
    since = datetime.utcnow() - timedelta(days=days)
    incidents = query.filter(Incident.created_at >= since).all()

    counts = {}
    for i in incidents:
        day = i.created_at.strftime("%Y-%m-%d")
        counts[day] = counts.get(day, 0) + 1

    return [{"date": k, "count": v} for k, v in sorted(counts.items())]

def get_severity_breakdown(db: Session, user: User):
    query = apply_visibility_filter(db, user, db.query(Incident))
    incidents = query.all()
    counts = {}
    for i in incidents:
        counts[i.severity.value] = counts.get(i.severity.value, 0) + 1
    return [{"severity": k, "count": v} for k, v in counts.items()]

def get_risk_distribution(db: Session, user: User):
    query = apply_visibility_filter(db, user, db.query(Incident))
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

def get_workflow_risk(db: Session, user: User):
    query = apply_visibility_filter(db, user, db.query(Incident))
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