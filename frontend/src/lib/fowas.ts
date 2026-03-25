import type {
  Category,
  DashboardFilters,
  Incident,
  RiskLevel,
  Severity,
  Status,
  Workflow,
} from "@/types";

export const severityOptions: Severity[] = ["LOW", "MEDIUM", "HIGH"];
export const riskLevelOptions: RiskLevel[] = ["LOW", "MODERATE", "HIGH"];
export const statusOptions: Status[] = ["OPEN", "INVESTIGATING", "RESOLVED"];
export const categoryOptions: Category[] = [
  "TECHNICAL",
  "OPERATIONAL",
  "HUMAN",
  "EXTERNAL",
  "SYSTEMIC",
];

export const subcategoryMap: Record<Category, string[]> = {
  TECHNICAL: ["Code Bug", "Infrastructure Failure", "Hardware Fault"],
  OPERATIONAL: ["Deployment Error", "Process Gap", "Configuration Mismatch"],
  HUMAN: ["Manual Error", "Misconfiguration", "Knowledge Gap"],
  EXTERNAL: ["Vendor Issue", "Network Outage", "Third-Party Dependency"],
  SYSTEMIC: ["Design Flaw", "Architecture Limitation", "Unhandled Edge Case"],
};

export const severityColors: Record<Severity, string> = {
  LOW: "#28d26f",
  MEDIUM: "#ffb11a",
  HIGH: "#ff5757",
};

export const riskColors: Record<RiskLevel, string> = {
  LOW: "#28d26f",
  MODERATE: "#ffb11a",
  HIGH: "#ff5757",
};

export const statusColors: Record<Status, string> = {
  OPEN: "#4484ff",
  INVESTIGATING: "#ffb11a",
  RESOLVED: "#28d26f",
};

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 5) {
    return "LOW";
  }

  if (score <= 15) {
    return "MODERATE";
  }

  return "HIGH";
}

export function computeRiskScore(severity: Severity, impact: number) {
  const multiplier = severity === "HIGH" ? 3 : severity === "MEDIUM" ? 2 : 1;
  return multiplier * impact;
}

export function enrichIncident(incident: Incident) {
  const riskScore = incident.risk_score ?? computeRiskScore(incident.severity, incident.impact);
  const riskLevel = incident.risk_level ?? getRiskLevel(riskScore);

  return {
    ...incident,
    risk_score: riskScore,
    risk_level: riskLevel,
  };
}

export function filterIncidents(incidents: Incident[], filters: DashboardFilters) {
  const now = Date.now();
  const rangeStart = now - filters.dateRange * 24 * 60 * 60 * 1000;
  const searchTerm = filters.search.trim().toLowerCase();

  return incidents
    .map(enrichIncident)
    .filter((incident) => {
      const createdAt = new Date(incident.created_at).getTime();
      const severityMatch =
        filters.severities.length === 0 || filters.severities.includes(incident.severity);
      const workflowMatch =
        filters.workflowIds.length === 0 || filters.workflowIds.includes(incident.workflow_id);
      const riskMatch =
        filters.riskLevels.length === 0 ||
        filters.riskLevels.includes(incident.risk_level ?? getRiskLevel(incident.risk_score ?? 0));
      const tagMatch =
        !filters.tag ||
        incident.tags.some((tag) => tag.name.toLowerCase() === filters.tag?.toLowerCase());
      const searchMatch =
        searchTerm.length === 0 ||
        incident.title.toLowerCase().includes(searchTerm) ||
        incident.main_category.toLowerCase().includes(searchTerm) ||
        incident.sub_category.toLowerCase().includes(searchTerm) ||
        incident.tags.some((tag) => tag.name.toLowerCase().includes(searchTerm));

      return (
        createdAt >= rangeStart &&
        severityMatch &&
        workflowMatch &&
        riskMatch &&
        tagMatch &&
        searchMatch
      );
    });
}

export function getSummaryMetrics(incidents: Incident[]) {
  const total = incidents.length;
  const resolved = incidents.filter((incident) => incident.status === "RESOLVED");
  const open = incidents.filter((incident) => incident.status === "OPEN");
  const highRisk = incidents.filter((incident) => (incident.risk_score ?? 0) > 15);

  let mttrHours: number | null = null;
  if (resolved.length > 0) {
    const totalResolutionHours = resolved.reduce((sum, incident) => {
      if (!incident.resolved_at) {
        return sum;
      }

      const createdAt = new Date(incident.created_at).getTime();
      const resolvedAt = new Date(incident.resolved_at).getTime();
      return sum + (resolvedAt - createdAt) / (1000 * 60 * 60);
    }, 0);

    mttrHours = totalResolutionHours / resolved.length;
  }

  let mtbfHours: number | null = null;
  if (incidents.length > 1) {
    const sorted = [...incidents].sort(
      (left, right) =>
        new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
    );
    let diff = 0;

    for (let index = 1; index < sorted.length; index += 1) {
      diff +=
        (new Date(sorted[index].created_at).getTime() -
          new Date(sorted[index - 1].created_at).getTime()) /
        (1000 * 60 * 60);
    }

    mtbfHours = diff / (sorted.length - 1);
  }

  return {
    total,
    open: open.length,
    resolved: resolved.length,
    highRisk: highRisk.length,
    mttrHours,
    mtbfHours,
    availabilityRatio: total === 0 ? null : resolved.length / total,
  };
}

export function getSeverityBreakdown(incidents: Incident[]) {
  return severityOptions.map((severity) => ({
    label: severity,
    value: incidents.filter((incident) => incident.severity === severity).length,
    color: severityColors[severity],
  }));
}

export function getRiskDistribution(incidents: Incident[]) {
  return riskLevelOptions.map((level) => ({
    label: level,
    value: incidents.filter((incident) => incident.risk_level === level).length,
    color: riskColors[level],
  }));
}

export function getTrendData(incidents: Incident[], days: number) {
  const buckets = new Map<string, { active: number; resolved: number }>();
  const today = new Date();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const current = new Date(today);
    current.setDate(today.getDate() - offset);
    const key = current.toISOString().slice(0, 10);
    buckets.set(key, { active: 0, resolved: 0 });
  }

  for (const incident of incidents) {
    const createdKey = new Date(incident.created_at).toISOString().slice(0, 10);
    const bucket = buckets.get(createdKey);

    if (bucket) {
      bucket.active += 1;
    }

    if (incident.resolved_at) {
      const resolvedKey = new Date(incident.resolved_at).toISOString().slice(0, 10);
      const resolvedBucket = buckets.get(resolvedKey);

      if (resolvedBucket) {
        resolvedBucket.resolved += 1;
      }
    }
  }

  return Array.from(buckets.entries()).map(([date, values]) => ({
    date,
    active: values.active,
    resolved: values.resolved,
  }));
}

export function getWorkflowRisk(incidents: Incident[], workflows: Workflow[]) {
  return workflows
    .map((workflow) => {
      const related = incidents.filter((incident) => incident.workflow_id === workflow.id);
      const avgRisk =
        related.length === 0
          ? 0
          : related.reduce((sum, incident) => sum + (incident.risk_score ?? 0), 0) /
            related.length;

      return {
        label: workflow.name,
        value: avgRisk,
        count: related.length,
      };
    })
    .sort((left, right) => right.value - left.value);
}

export function getScatterPoints(incidents: Incident[]) {
  return incidents.map((incident) => ({
    x: incident.impact,
    y: incident.severity === "HIGH" ? 3 : incident.severity === "MEDIUM" ? 2 : 1,
    label: incident.title,
    color: severityColors[incident.severity],
  }));
}

export function formatMetric(value: number | null, digits = 1) {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }

  return value.toFixed(digits);
}

export function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }

  return `${Math.round(value * 100)}%`;
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(new Date(date));
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
