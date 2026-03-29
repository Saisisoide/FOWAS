import type { Incident, Workflow } from "@/types";
import {
  computeRiskScore,
  getRiskLevel,
  formatMetric,
  formatPercent,
  getSummaryMetrics,
  getSeverityBreakdown,
  getRiskDistribution,
  getWorkflowRisk,
} from "@/lib/fowas";

/* ------------------------------------------------------------------ */
/*  CSV Export                                                         */
/* ------------------------------------------------------------------ */

function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportIncidentsCSV(incidents: Incident[], workflows: Workflow[]) {
  const headers = [
    "Title",
    "Severity",
    "Impact",
    "Risk Score",
    "Risk Level",
    "Status",
    "Category",
    "Subcategory",
    "Workflow",
    "Engineer",
    "Tags",
    "Visibility",
    "Created At",
    "Resolved At",
    "Notes",
  ];

  const rows = incidents.map((inc) => {
    const riskScore = inc.risk_score ?? computeRiskScore(inc.severity, inc.impact);
    const riskLevel = inc.risk_level ?? getRiskLevel(riskScore);
    const workflowName = workflows.find((w) => w.id === inc.workflow_id)?.name ?? "";

    return [
      escapeCSV(inc.title),
      inc.severity,
      String(inc.impact),
      String(riskScore),
      riskLevel,
      inc.status,
      inc.main_category,
      inc.sub_category,
      escapeCSV(workflowName),
      escapeCSV(inc.engineer),
      escapeCSV(inc.tags.map((t) => t.name).join("; ")),
      inc.visibility,
      inc.created_at,
      inc.resolved_at ?? "",
      escapeCSV(inc.notes),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  downloadFile(csv, `fowas-incidents-${dateStamp()}.csv`, "text/csv");
}

/* ------------------------------------------------------------------ */
/*  PDF Export (print-ready HTML → browser Save as PDF)                */
/* ------------------------------------------------------------------ */

export function exportDashboardPDF(incidents: Incident[], workflows: Workflow[]) {
  const summary = getSummaryMetrics(incidents);
  const severity = getSeverityBreakdown(incidents);
  const risk = getRiskDistribution(incidents);
  const wfRisk = getWorkflowRisk(incidents, workflows);

  const incidentRows = incidents
    .slice(0, 50)
    .map((inc) => {
      const riskScore = inc.risk_score ?? computeRiskScore(inc.severity, inc.impact);
      const riskLevel = inc.risk_level ?? getRiskLevel(riskScore);
      const wfName = workflows.find((w) => w.id === inc.workflow_id)?.name ?? "--";
      return `
        <tr>
          <td>${esc(inc.title)}</td>
          <td class="${inc.severity.toLowerCase()}">${inc.severity}</td>
          <td>${inc.impact}</td>
          <td><strong>${riskScore}</strong> <span class="dim">${riskLevel}</span></td>
          <td>${inc.status}</td>
          <td>${esc(wfName)}</td>
          <td>${inc.main_category}</td>
          <td>${new Date(inc.created_at).toLocaleDateString()}</td>
        </tr>`;
    })
    .join("");

  const severityRows = severity
    .map((s) => `<tr><td>${s.label}</td><td>${s.value}</td></tr>`)
    .join("");

  const riskRows = risk
    .map((r) => `<tr><td>${r.label}</td><td>${r.value}</td></tr>`)
    .join("");

  const wfRows = wfRisk
    .map(
      (w) =>
        `<tr><td>${esc(w.label)}</td><td>${w.value.toFixed(1)}</td><td>${w.count}</td></tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>FOWAS Reliability Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "Segoe UI", Arial, sans-serif; color: #1a1a2e; padding: 40px; font-size: 11px; }
    h1 { font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }
    h2 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 28px; margin-bottom: 10px; color: #334; border-bottom: 2px solid #4484ff; padding-bottom: 4px; }
    .subtitle { color: #666; font-size: 12px; margin-top: 4px; }
    .meta { color: #888; font-size: 10px; margin-top: 2px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 16px; }
    .kpi { border: 1px solid #e0e4ec; border-radius: 8px; padding: 12px; }
    .kpi .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; color: #888; }
    .kpi .value { font-size: 22px; font-weight: 700; margin-top: 4px; }
    .kpi .detail { font-size: 9px; color: #999; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10px; }
    th { text-align: left; padding: 6px 8px; background: #f4f6fa; font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #555; border-bottom: 2px solid #dde; }
    td { padding: 5px 8px; border-bottom: 1px solid #eef; }
    .dim { color: #999; font-size: 9px; }
    .high { color: #e24b4a; font-weight: 700; }
    .medium { color: #ba7517; font-weight: 600; }
    .low { color: #639922; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>FOWAS Reliability Report</h1>
  <p class="subtitle">Failure-Oriented Workflow Analysis System</p>
  <p class="meta">Generated ${new Date().toLocaleString()} &mdash; ${incidents.length} incidents in scope</p>

  <h2>Executive Summary</h2>
  <div class="kpi-grid">
    <div class="kpi">
      <div class="label">Total Incidents</div>
      <div class="value">${summary.total}</div>
    </div>
    <div class="kpi">
      <div class="label">High Risk (R &gt; 15)</div>
      <div class="value high">${summary.highRisk}</div>
    </div>
    <div class="kpi">
      <div class="label">Resolved</div>
      <div class="value">${summary.resolved}</div>
      <div class="detail">Availability ${formatPercent(summary.availabilityRatio)}</div>
    </div>
    <div class="kpi">
      <div class="label">MTTR</div>
      <div class="value">${formatMetric(summary.mttrHours)} hrs</div>
      <div class="detail">MTBF ${formatMetric(summary.mtbfHours)} hrs</div>
    </div>
  </div>

  <div class="two-col">
    <div>
      <h2>Severity Breakdown</h2>
      <table>
        <thead><tr><th>Severity</th><th>Count</th></tr></thead>
        <tbody>${severityRows}</tbody>
      </table>
    </div>
    <div>
      <h2>Risk Distribution</h2>
      <table>
        <thead><tr><th>Band</th><th>Count</th></tr></thead>
        <tbody>${riskRows}</tbody>
      </table>
    </div>
  </div>

  <h2>Workflow Risk Comparison</h2>
  <table>
    <thead><tr><th>Workflow</th><th>Avg Risk Score</th><th>Incidents</th></tr></thead>
    <tbody>${wfRows.length > 0 ? wfRows : '<tr><td colspan="3" class="dim">No workflow data</td></tr>'}</tbody>
  </table>

  <h2>Incident Log${incidents.length > 50 ? " (showing first 50)" : ""}</h2>
  <table>
    <thead>
      <tr>
        <th>Title</th><th>Severity</th><th>Impact</th><th>Risk</th>
        <th>Status</th><th>Workflow</th><th>Category</th><th>Created</th>
      </tr>
    </thead>
    <tbody>${incidentRows.length > 0 ? incidentRows : '<tr><td colspan="8" class="dim">No incidents</td></tr>'}</tbody>
  </table>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    // Small delay to let styles render before print dialog
    setTimeout(() => printWindow.print(), 400);
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function esc(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
