"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DonutChart, BarChart, LineAreaChart, ProgressList } from "@/components/charts/system-charts";
import { LogIncidentModal } from "@/components/incidents/log-incident-modal";
import { Panel } from "@/components/ui/panel";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import {
  computeInsights,
  filterIncidents,
  formatMetric,
  formatPercent,
  getAttentionQueue,
  getHealthSummary,
  getRiskDistribution,
  getSeverityBreakdown,
  getSummaryMetrics,
  getTrendData,
  getWorkflowRisk,
  riskColors,
  severityColors,
  statusColors,
} from "@/lib/fowas";
import { getIncidents, getWorkflows, getAnalyticsSummary } from "@/services/api";
import { exportIncidentsCSV, exportDashboardPDF } from "@/lib/export";
import type { AnalyticsSummary, Incident, Workflow } from "@/types";

function StatCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-white/[0.06] bg-white/[0.02] p-5">
      <p className="mono text-[10px] uppercase tracking-[0.14em] text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums" style={{ color: accent ?? "#fff" }}>
        {value}
      </p>
      <p className="mt-1.5 text-[12px] text-slate-600">{detail}</p>
    </div>
  );
}

function LoadingPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="skeleton h-1.5 w-20 rounded-full" />
      <p className="text-[11px] text-slate-700">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { filters, setWorkflows: setGlobalWorkflows } = useGlobalFilters();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [serverSummary, setServerSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [incidentData, workflowData, summaryData] = await Promise.all([
          getIncidents(),
          getWorkflows(),
          getAnalyticsSummary(),
        ]);
        setIncidents(incidentData);
        setWorkflows(workflowData);
        setGlobalWorkflows(workflowData);
        setServerSummary(summaryData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [setGlobalWorkflows]);

  // Client-side filtered data for charts and insights
  const filteredIncidents = filterIncidents(incidents, filters);
  const clientSummary = getSummaryMetrics(filteredIncidents);
  const severityBreakdown = getSeverityBreakdown(filteredIncidents);
  const riskDistribution = getRiskDistribution(filteredIncidents);
  const workflowRisk = getWorkflowRisk(filteredIncidents, workflows).slice(0, 4);
  const trend = getTrendData(filteredIncidents, filters.dateRange);
  const insights = computeInsights(filteredIncidents, workflows, clientSummary);
  const healthSummary = getHealthSummary(filteredIncidents, clientSummary);
  const attentionQueue = getAttentionQueue(filteredIncidents, clientSummary.mttrHours).slice(0, 6);

  // Use server summary for KPIs when no filters are active, fall back to client
  const hasActiveFilters = filters.severities.length > 0 || filters.workflowIds.length > 0 || filters.search.trim() !== "";
  const summary = hasActiveFilters ? clientSummary : {
    total: serverSummary?.total_incidents ?? clientSummary.total,
    highRisk: serverSummary?.high_risk_count ?? clientSummary.highRisk,
    resolved: serverSummary?.resolved_count ?? clientSummary.resolved,
    mttrHours: serverSummary?.mttr_hours ?? clientSummary.mttrHours,
    mtbfHours: serverSummary?.mtbf_hours ?? clientSummary.mtbfHours,
    availabilityRatio: serverSummary?.availability_ratio ?? clientSummary.availabilityRatio,
    open: serverSummary?.open_incidents ?? clientSummary.open,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold tracking-tight text-white">
            Reliability Overview
          </h1>
          {!loading && (
            <p className="max-w-2xl text-[13px] leading-relaxed text-slate-500">
              {healthSummary}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => exportIncidentsCSV(filteredIncidents, workflows)}
            disabled={loading || filteredIncidents.length === 0}
            className="chip text-[11px] transition hover:border-[var(--green)]/40 hover:text-[var(--green)] disabled:opacity-25"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => exportDashboardPDF(filteredIncidents, workflows)}
            disabled={loading || filteredIncidents.length === 0}
            className="chip text-[11px] transition hover:border-[var(--blue)]/40 hover:text-[var(--blue)] disabled:opacity-25"
          >
            Export PDF
          </button>
        </div>
      </section>

      {/* KPI Cards — driven by backend analytics */}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Incidents"
          value={String(summary.total)}
          detail={hasActiveFilters ? "Filtered scope" : "Server-computed"}
        />
        <StatCard
          label="High Risk"
          value={String(summary.highRisk)}
          detail="Score > 15"
          accent={summary.highRisk > 0 ? "var(--coral)" : undefined}
        />
        <StatCard
          label="Resolved"
          value={String(summary.resolved)}
          detail={`Availability ${formatPercent(summary.availabilityRatio)}`}
          accent={summary.resolved > 0 ? "var(--green)" : undefined}
        />
        <StatCard
          label="MTTR"
          value={`${formatMetric(summary.mttrHours)}h`}
          detail={`MTBF ${formatMetric(summary.mtbfHours)}h`}
        />
      </section>

      {/* Insights */}
      {!loading && insights.length > 0 && (
        <section className="space-y-1.5">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`rounded-lg border px-4 py-2.5 text-[12px] leading-relaxed ${
                insight.type === "warning"
                  ? "border-[var(--amber)]/15 bg-[var(--amber)]/[0.03] text-amber-300/80"
                  : insight.type === "positive"
                    ? "border-[var(--green)]/15 bg-[var(--green)]/[0.03] text-green-300/80"
                    : "border-white/[0.06] bg-white/[0.01] text-slate-500"
              }`}
            >
              {insight.type === "warning" ? "⚠ " : insight.type === "positive" ? "✓ " : "ℹ "}
              {insight.message}
            </div>
          ))}
        </section>
      )}

      {error ? (
        <Panel>
          <p className="text-sm text-red-400">{error}</p>
        </Panel>
      ) : null}

      {/* Charts */}
      <section className="grid gap-5 xl:grid-cols-[1.6fr_0.75fr_0.75fr]">
        <Panel title="Risk Distribution" className="min-h-[320px]">
          {loading ? <LoadingPlaceholder label="Loading…" /> : <BarChart data={riskDistribution} />}
        </Panel>
        <Panel title="Severity Mix" className="min-h-[320px]">
          {loading ? (
            <LoadingPlaceholder label="Loading…" />
          ) : (
            <DonutChart data={severityBreakdown} valueLabel={`${summary.total || 0}`} />
          )}
        </Panel>
        <Panel title="Workflow Risk" className="min-h-[320px]">
          {loading ? <LoadingPlaceholder label="Loading…" /> : <ProgressList data={workflowRisk} maxValue={30} />}
        </Panel>
      </section>

      {/* Trend */}
      <Panel
        title={`Trend (${filters.dateRange}d)`}
        right={
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="node-dot" style={{ background: "var(--blue)", color: "var(--blue)" }} />
              Active
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-slate-600">
              <span className="node-dot" style={{ background: "#475569", color: "#475569" }} />
              Resolved
            </span>
          </div>
        }
      >
        {loading ? (
          <LoadingPlaceholder label="Loading…" />
        ) : (
          <LineAreaChart
            data={trend}
            lines={[
              { key: "active", color: "#3b7cf5" },
              { key: "resolved", color: "#64748b", dashed: true },
            ]}
          />
        )}
      </Panel>

      {/* Attention Queue */}
      <Panel
        title="Requires Attention"
        eyebrow="Priority Queue"
        right={
          <button type="button" onClick={() => setModalOpen(true)} className="fowas-button px-4 py-2 text-[12px]">
            Log Incident
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-[10px] font-medium uppercase tracking-wider text-slate-600">
                <th className="px-4 pb-2.5">Title</th>
                <th className="px-4 pb-2.5">Workflow</th>
                <th className="px-4 pb-2.5">Risk</th>
                <th className="px-4 pb-2.5">Severity</th>
                <th className="px-4 pb-2.5">Status</th>
                <th className="px-4 pb-2.5">Open</th>
              </tr>
            </thead>
            <tbody>
              {attentionQueue.map((incident) => (
                <tr key={incident.id} className="border-b border-white/[0.03] transition hover:bg-white/[0.015]">
                  <td className="px-4 py-3">
                    <Link
                      href={`/incidents/${incident.id}`}
                      className="text-[13px] font-medium text-white hover:text-[var(--blue)] transition-colors"
                    >
                      {incident.title}
                      {incident._overdue ? (
                        <span className="ml-1.5 text-[9px] font-semibold text-[var(--red)] pulse-dot">OVERDUE</span>
                      ) : null}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-slate-500">
                    {workflows.find((w) => w.id === incident.workflow_id)?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="mono text-[13px] font-semibold tabular-nums"
                      style={{ color: riskColors[incident.risk_level ?? "LOW"] }}
                    >
                      {incident.risk_score ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge" style={{ color: severityColors[incident.severity] }}>
                      {incident.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge" style={{ color: statusColors[incident.status] }}>
                      {incident.status}
                    </span>
                  </td>
                  <td className={`px-4 py-3 mono text-[11px] tabular-nums ${
                    incident._overdue ? "text-[var(--red)]" : "text-slate-600"
                  }`}>
                    {incident._hoursOpen.toFixed(1)}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && attentionQueue.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-[13px] text-slate-600">All clear — no unresolved incidents.</p>
          </div>
        ) : null}
      </Panel>

      <LogIncidentModal
        open={modalOpen}
        workflows={workflows}
        incidents={incidents}
        onClose={() => setModalOpen(false)}
        onCreated={(incident) => setIncidents((current) => [incident, ...current])}
      />
    </div>
  );
}
