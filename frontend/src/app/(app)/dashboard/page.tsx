"use client";

import { useEffect, useState } from "react";
import { DonutChart, BarChart, LineAreaChart, ProgressList } from "@/components/charts/system-charts";
import { LogIncidentModal } from "@/components/incidents/log-incident-modal";
import { Panel } from "@/components/ui/panel";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import {
  filterIncidents,
  formatDate,
  formatMetric,
  formatPercent,
  getRiskDistribution,
  getSeverityBreakdown,
  getSummaryMetrics,
  getTrendData,
  getWorkflowRisk,
  severityOptions,
  statusColors,
} from "@/lib/fowas";
import { getIncidents, getOrganisations, getWorkflows } from "@/services/api";
import { exportIncidentsCSV, exportDashboardPDF } from "@/lib/export";
import type { DashboardFilters, Incident, Organisation, Workflow } from "@/types";

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-white/3 p-5">
      <p className="mono text-[11px] uppercase tracking-[0.28em] text-slate-500">{label}</p>
      <p className="mt-3 text-4xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{detail}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { filters, setFilters, setWorkflows: setGlobalWorkflows } = useGlobalFilters();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [incidentData, workflowData, organisationData] = await Promise.all([
          getIncidents(),
          getWorkflows(),
          getOrganisations(),
        ]);

        setIncidents(incidentData);
        setWorkflows(workflowData);
        setGlobalWorkflows(workflowData);
        setOrganisations(organisationData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [setGlobalWorkflows]);

  const filteredIncidents = filterIncidents(incidents, filters);
  const summary = getSummaryMetrics(filteredIncidents);
  const severityBreakdown = getSeverityBreakdown(filteredIncidents);
  const riskDistribution = getRiskDistribution(filteredIncidents);
  const workflowRisk = getWorkflowRisk(filteredIncidents, workflows).slice(0, 3);
  const trend = getTrendData(filteredIncidents, filters.dateRange);
  const recentIncidents = [...filteredIncidents]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Incidents"
          value={String(summary.total)}
          detail="All incidents in the current filter scope"
        />
        <StatCard
          label="High Risk"
          value={String(summary.highRisk)}
          detail="Priority incidents with risk score above 15"
        />
        <StatCard
          label="Resolved"
          value={String(summary.resolved)}
          detail={`Availability ${formatPercent(summary.availabilityRatio)}`}
        />
        <StatCard
          label="MTTR"
          value={formatMetric(summary.mttrHours)}
          detail={`MTBF ${formatMetric(summary.mtbfHours)} hrs`}
        />
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[7, 14, 30, 90].map((range) => (
            <button
              key={range}
              type="button"
              onClick={() =>
                setFilters((current) => ({
                  ...current,
                  dateRange: range as DashboardFilters["dateRange"],
                }))
              }
              className={`chip mono text-xs uppercase tracking-[0.22em] ${
                filters.dateRange === range ? "border-[#4484ff] text-white" : ""
              }`}
            >
              {range}d
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {severityOptions.map((severity) => (
            <button
              key={severity}
              type="button"
              onClick={() =>
                setFilters((current) => ({
                  ...current,
                  severities: current.severities.includes(severity)
                    ? current.severities.filter((item) => item !== severity)
                    : [...current.severities, severity],
                }))
              }
              className={`chip mono text-xs uppercase tracking-[0.22em] ${
                filters.severities.includes(severity) ? "border-[#4484ff] text-white" : ""
              }`}
            >
              {severity}
            </button>
          ))}
          <span className="mx-1 self-center text-white/10">|</span>
          <button
            type="button"
            onClick={() => exportIncidentsCSV(filteredIncidents, workflows)}
            disabled={loading || filteredIncidents.length === 0}
            className="chip mono text-xs uppercase tracking-[0.22em] transition hover:border-[#28d26f] hover:text-[#28d26f] disabled:opacity-30"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => exportDashboardPDF(filteredIncidents, workflows)}
            disabled={loading || filteredIncidents.length === 0}
            className="chip mono text-xs uppercase tracking-[0.22em] transition hover:border-[#4484ff] hover:text-[#4484ff] disabled:opacity-30"
          >
            Export PDF
          </button>
        </div>
      </section>

      {error ? (
        <Panel className="rounded-[1.75rem]">
          <p className="text-sm text-red-200">{error}</p>
        </Panel>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.6fr_0.75fr_0.75fr]">
        <Panel
          title="Risk Distribution"
          eyebrow="Global Filters"
          className="min-h-[340px]"
        >
          {loading ? (
            <div className="mono text-sm uppercase tracking-[0.2em] text-slate-500">
              Loading histogram...
            </div>
          ) : (
            <BarChart data={riskDistribution} />
          )}
        </Panel>

        <Panel title="Severity Mix" className="min-h-[340px]">
          {loading ? (
            <div className="mono text-sm uppercase tracking-[0.2em] text-slate-500">
              Loading severity breakdown...
            </div>
          ) : (
            <DonutChart
              data={severityBreakdown}
              valueLabel={`${summary.total || 0}`}
            />
          )}
        </Panel>

        <Panel title="Workflow Exposure" className="min-h-[340px]">
          {loading ? (
            <div className="mono text-sm uppercase tracking-[0.2em] text-slate-500">
              Loading workflow exposure...
            </div>
          ) : (
            <ProgressList data={workflowRisk} maxValue={30} />
          )}
        </Panel>
      </section>

      <Panel
        title="Incident Trend (30 Days)"
        right={
          <div className="flex items-center gap-6">
            <span className="mono text-xs uppercase tracking-[0.22em] text-[#4f8cff]">
              Active
            </span>
            <span className="mono text-xs uppercase tracking-[0.22em] text-slate-500">
              Resolved
            </span>
          </div>
        }
      >
        {loading ? (
          <div className="mono text-sm uppercase tracking-[0.2em] text-slate-500">
            Loading trend...
          </div>
        ) : (
          <LineAreaChart
            data={trend}
            lines={[
              { key: "active", color: "#4484ff" },
              { key: "resolved", color: "#8aa6d9", dashed: true },
            ]}
          />
        )}
      </Panel>

      <Panel
        title="Recent Incidents"
        right={
          <button type="button" onClick={() => setModalOpen(true)} className="fowas-button px-4 py-3">
            Log Incident
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="mono text-xs uppercase tracking-[0.24em] text-slate-500">
                <th className="px-4 text-left">Title</th>
                <th className="px-4 text-left">Workflow</th>
                <th className="px-4 text-left">Severity</th>
                <th className="px-4 text-left">Status</th>
                <th className="px-4 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentIncidents.map((incident) => (
                <tr key={incident.id} className="rounded-2xl bg-white/[0.025]">
                  <td className="rounded-l-2xl px-4 py-4 text-sm text-white">{incident.title}</td>
                  <td className="px-4 py-4 text-sm text-slate-300">
                    {workflows.find((workflow) => workflow.id === incident.workflow_id)?.name ?? "--"}
                  </td>
                  <td className="px-4 py-4">
                    <span className="mono text-xs uppercase tracking-[0.18em]" style={{ color: incident.severity === "HIGH" ? "#ff5757" : incident.severity === "MEDIUM" ? "#ffb11a" : "#28d26f" }}>
                      {incident.severity}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="mono text-xs uppercase tracking-[0.18em]" style={{ color: statusColors[incident.status] }}>
                      {incident.status}
                    </span>
                  </td>
                  <td className="rounded-r-2xl px-4 py-4 text-sm text-slate-400">
                    {formatDate(incident.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && recentIncidents.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No incidents match the active filters. Create your first incident to populate the cockpit.
          </p>
        ) : null}
      </Panel>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Workspace Status">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-5">
              <p className="mono text-xs uppercase tracking-[0.24em] text-slate-500">
                Organizations
              </p>
              <p className="mt-3 text-4xl font-semibold text-white">{organisations.length}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-5">
              <p className="mono text-xs uppercase tracking-[0.24em] text-slate-500">
                Workflows
              </p>
              <p className="mt-3 text-4xl font-semibold text-white">{workflows.length}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-5">
              <p className="mono text-xs uppercase tracking-[0.24em] text-slate-500">
                Filter Range
              </p>
              <p className="mt-3 text-4xl font-semibold text-white">{filters.dateRange}d</p>
            </div>
          </div>
        </Panel>

        <Panel title="Signal Mix">
          <div className="space-y-4">
            {severityBreakdown.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="mono text-xs uppercase tracking-[0.2em]" style={{ color: item.color }}>
                    {item.label}
                  </span>
                  <span className="mono text-xs uppercase tracking-[0.2em] text-slate-400">
                    {item.value}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${summary.total === 0 ? 0 : (item.value / summary.total) * 100}%`,
                      background: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

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
