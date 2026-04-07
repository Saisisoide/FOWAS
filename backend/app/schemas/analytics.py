from pydantic import BaseModel
from typing import Optional, List

class AnalyticsSummary(BaseModel):
    total_incidents: int
    open_incidents: int
    high_risk_count: int
    resolved_count: int
    mttr_hours: Optional[float]
    mtbf_hours: Optional[float]
    availability_ratio: Optional[float]

class TrendPoint(BaseModel):
    date: str
    count: int

class RiskBucket(BaseModel):
    range: str
    count: int

class WorkflowRisk(BaseModel):
    workflow_name: str
    avg_risk: float
    incident_count: int

class SeverityCount(BaseModel):
    severity: str
    count: int