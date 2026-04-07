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

export const severityGuidance: Record<Severity, string> = {
  LOW: "Low urgency. A minor issue with limited disruption, workaround available, and little business impact.",
  MEDIUM:
    "Noticeable disruption. The issue affects a team, workflow, or customer path, but the system is still partially usable.",
  HIGH: "Critical disruption. Core functionality is blocked, customers are affected, or immediate escalation is needed.",
};

export const categoryGuidance: Record<Category, string> = {
  TECHNICAL: "Use for faults in code, infrastructure, hardware, or platform behavior.",
  OPERATIONAL: "Use for release, process, configuration, or runbook execution problems.",
  HUMAN: "Use when a person-driven action, gap, or oversight triggered the incident.",
  EXTERNAL: "Use when the root cause sits outside your direct control, such as vendors or upstream services.",
  SYSTEMIC: "Use for deeper design or architecture weaknesses that make incidents repeat or spread.",
};

export const subcategoryGuidance: Record<string, string> = {
  "Code Bug": "Application logic behaved incorrectly or failed under expected usage.",
  "Infrastructure Failure": "A hosting, compute, storage, or platform component stopped working as expected.",
  "Hardware Fault": "A physical device or hardware-dependent resource caused the failure.",
  "Deployment Error": "The issue was introduced during release, rollout, or environment promotion.",
  "Process Gap": "A missing or weak operational process allowed the incident to happen.",
  "Configuration Mismatch": "Settings were incorrect, inconsistent, or drifted between environments.",
  "Manual Error": "A direct human action accidentally triggered or worsened the incident.",
  Misconfiguration: "A system or service was set up incorrectly during manual handling.",
  "Knowledge Gap": "The incident was linked to missing training, unclear ownership, or insufficient documentation.",
  "Vendor Issue": "A supplier or external provider introduced the disruption.",
  "Network Outage": "Connectivity problems interrupted traffic, service calls, or access.",
  "Third-Party Dependency": "An upstream dependency degraded and impacted your workflow.",
  "Design Flaw": "The incident exposed a weakness in the intended design itself.",
  "Architecture Limitation": "The current system structure could not safely handle the scenario.",
  "Unhandled Edge Case": "A rare but valid condition was not covered in the solution.",
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

export function getImpactGuidance(impact: number) {
  if (impact <= 2) {
    return "1-2: Minimal impact. A small inconvenience with no meaningful service or business disruption.";
  }

  if (impact <= 4) {
    return "3-4: Limited impact. A contained issue affecting a small feature, team, or short-lived workflow.";
  }

  if (impact <= 6) {
    return "5-6: Moderate impact. Multiple users or an important workflow are affected, but operations continue.";
  }

  if (impact <= 8) {
    return "7-8: Major impact. A key service is degraded, response effort is urgent, and business impact is clear.";
  }

  return "9-10: Severe impact. Critical service failure, broad disruption, or major customer/business harm.";
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

/* ------------------------------------------------------------------ */
/*  Insight Engine (rule-based)                                        */
/* ------------------------------------------------------------------ */

export interface Insight {
  type: "warning" | "info" | "positive";
  message: string;
}

export function computeInsights(
  incidents: Incident[],
  workflows: Workflow[],
  summary: ReturnType<typeof getSummaryMetrics>,
): Insight[] {
  const insights: Insight[] = [];

  // Rule 1: High severity dominance
  const highCount = incidents.filter((i) => i.severity === "HIGH").length;
  if (incidents.length >= 3 && highCount / incidents.length > 0.5) {
    insights.push({
      type: "warning",
      message: `${Math.round((highCount / incidents.length) * 100)}% of incidents are HIGH severity. Review whether severity is being overclassified, or if systemic issues are accumulating.`,
    });
  }

  // Rule 2: Overdue incidents (open longer than 2× MTTR)
  const avgMttr = summary.mttrHours ?? 24;
  const overdue = incidents.filter((i) => {
    if (i.status === "RESOLVED") return false;
    const hoursOpen =
      (Date.now() - new Date(i.created_at).getTime()) / (1000 * 60 * 60);
    return hoursOpen > avgMttr * 2;
  });
  if (overdue.length > 0) {
    insights.push({
      type: "warning",
      message: `${overdue.length} incident${overdue.length > 1 ? "s" : ""} open longer than 2× average resolution time (${avgMttr.toFixed(1)}h). Oldest: "${overdue[0].title}".`,
    });
  }

  // Rule 3: Recurring category (3+ incidents with same category+subcategory)
  const categoryCounts = new Map<string, number>();
  for (const inc of incidents) {
    const key = `${inc.main_category} › ${inc.sub_category}`;
    categoryCounts.set(key, (categoryCounts.get(key) ?? 0) + 1);
  }
  for (const [category, count] of categoryCounts) {
    if (count >= 3) {
      insights.push({
        type: "warning",
        message: `"${category}" appeared ${count} times. This pattern suggests a systemic issue — not isolated incidents.`,
      });
    }
  }

  // Rule 4: Workflow with high avg risk
  const workflowRisks = workflows
    .map((w) => {
      const related = incidents.filter((i) => i.workflow_id === w.id);
      const avg =
        related.length === 0
          ? 0
          : related.reduce((s, i) => s + (i.risk_score ?? 0), 0) /
            related.length;
      return { name: w.name, avg, count: related.length };
    })
    .filter((w) => w.count >= 2);

  const highestRisk = workflowRisks.sort((a, b) => b.avg - a.avg)[0];
  if (highestRisk && highestRisk.avg > 15) {
    insights.push({
      type: "warning",
      message: `"${highestRisk.name}" has an average risk score of ${highestRisk.avg.toFixed(0)} across ${highestRisk.count} incidents — above the HIGH threshold.`,
    });
  }

  // Rule 5: Good resolution rate
  if (summary.total >= 5 && summary.resolved / summary.total >= 0.7) {
    insights.push({
      type: "positive",
      message: `${Math.round((summary.resolved / summary.total) * 100)}% resolution rate. Operational responsiveness is healthy.`,
    });
  }

  // Rule 6: Resolved incidents missing notes
  const noNotes = incidents.filter(
    (i) => i.status === "RESOLVED" && (!i.notes || i.notes.trim() === ""),
  );
  if (noNotes.length > 0) {
    insights.push({
      type: "info",
      message: `${noNotes.length} resolved incident${noNotes.length > 1 ? "s have" : " has"} no reflection notes. Documenting root cause improves team learning.`,
    });
  }

  return insights;
}

/* ------------------------------------------------------------------ */
/*  Health Summary                                                     */
/* ------------------------------------------------------------------ */

export function getHealthSummary(
  incidents: Incident[],
  summary: ReturnType<typeof getSummaryMetrics>,
): string {
  if (summary.total === 0) return "No incidents in the current filter range.";

  const parts: string[] = [];

  const highCount = incidents.filter((i) => i.severity === "HIGH").length;
  if (highCount > summary.total * 0.5) {
    parts.push(
      `${highCount} of ${summary.total} incidents are high risk — risk is concentrated`,
    );
  }

  if (summary.mttrHours !== null) {
    if (summary.mttrHours < 2) parts.push("resolution speed is strong");
    else if (summary.mttrHours > 12)
      parts.push(
        `average resolution time is ${summary.mttrHours.toFixed(1)} hours — consider faster triage`,
      );
  }

  const unresolved = summary.total - summary.resolved;
  if (unresolved > 0) {
    parts.push(
      `${unresolved} incident${unresolved > 1 ? "s" : ""} still unresolved`,
    );
  }

  return parts.length > 0
    ? parts.join(". ") + "."
    : "System reliability is within normal parameters.";
}

/* ------------------------------------------------------------------ */
/*  Attention Queue                                                    */
/* ------------------------------------------------------------------ */

export interface AttentionIncident extends Incident {
  _hoursOpen: number;
  _overdue: boolean;
}

export function getAttentionQueue(
  incidents: Incident[],
  mttrHours: number | null,
): AttentionIncident[] {
  const avgMttr = mttrHours ?? 24;
  const unresolved = incidents.filter((i) => i.status !== "RESOLVED");

  return unresolved
    .map((incident) => {
      const hoursOpen =
        (Date.now() - new Date(incident.created_at).getTime()) /
        (1000 * 60 * 60);
      return {
        ...incident,
        _hoursOpen: hoursOpen,
        _overdue: hoursOpen > avgMttr * 2,
      };
    })
    .sort((a, b) => {
      if (a._overdue && !b._overdue) return -1;
      if (!a._overdue && b._overdue) return 1;
      return (b.risk_score ?? 0) - (a.risk_score ?? 0);
    });
}
