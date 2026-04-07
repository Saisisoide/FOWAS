from typing import List, Optional
from dataclasses import dataclass

@dataclass
class ReliabilityMetrics:
    mttr_hours: Optional[float]
    mtbf_hours: Optional[float]
    availability_ratio: Optional[float]

def compute_metrics(incidents: List[dict]) -> ReliabilityMetrics:
    resolved = [i for i in incidents if i["resolved_at"] is not None]

    mttr = None
    if resolved:
        times = [
            (i["resolved_at"] - i["created_at"]).total_seconds() / 3600
            for i in resolved
        ]
        mttr = round(sum(times) / len(times), 2)

    mtbf = None
    if len(incidents) > 1:
        sorted_inc = sorted(incidents, key=lambda x: x["created_at"])
        gaps = [
            (sorted_inc[k + 1]["created_at"] - sorted_inc[k]["created_at"]).total_seconds() / 3600
            for k in range(len(sorted_inc) - 1)
        ]
        mtbf = round(sum(gaps) / len(gaps), 2)

    avail = None
    if incidents:
        avail = round(len(resolved) / len(incidents), 4)

    return ReliabilityMetrics(mttr_hours=mttr, mtbf_hours=mtbf, availability_ratio=avail)