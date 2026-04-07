from enum import Enum
from dataclasses import dataclass

SEVERITY_MAP = {"LOW": 1, "MEDIUM": 2, "HIGH": 3}

class RiskLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"

@dataclass(frozen=True)
class RiskResult:
    score: int
    level: RiskLevel

def compute_risk(severity: str, impact: int) -> RiskResult:
    severity_num = SEVERITY_MAP.get(severity.upper(), 1)
    score = severity_num * impact
    if score <= 5:
        level = RiskLevel.LOW
    elif score <= 15:
        level = RiskLevel.MODERATE
    else:
        level = RiskLevel.HIGH
    return RiskResult(score=score, level=level)

RISK_COLOURS = {
    RiskLevel.LOW: "#639922",
    RiskLevel.MODERATE: "#BA7517",
    RiskLevel.HIGH: "#E24B4A",
}