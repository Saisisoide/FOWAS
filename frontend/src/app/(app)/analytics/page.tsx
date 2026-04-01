"use client";

import { useEffect, useState } from "react";
import { BarChart, ProgressList, ScatterPlot } from "@/components/charts/system-charts";
import { Panel } from "@/components/ui/panel";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import {
  filterIncidents,
  getRiskDistribution,
  getScatterPoints,
  getSeverityBreakdown,
  getWorkflowRisk,
} from "@/lib/fowas";
import { getIncidents, getWorkflows } from "@/services/api";
import { exportIncidentsCSV, exportDashboardPDF } from "@/lib/export";
import type { Incident, Workflow } from "@/types";

function LoadingPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="skeleton h-1.5 w-24 rounded-full" />
      <p className="text-xs text-slate-600">{label}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const { filters, setWorkflows: setGlobalWorkflows } = useGlobalFilters();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [incidentData, workflowData] = await Promise.all([
          getIncidents(),
          getWorkflows(),
        ]);
        setIncidents(incidentData);
        setWorkflows(workflowData);
        setGlobalWorkflows(workflowData);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [setGlobalWorkflows]);
  const filtered = filterIncidents(incidents, filters);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono text-[11px] uppercase tracking-widest text-[var(--blue-muted)]">
            Analytics
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-white">
            Reliability Metrics
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportIncidentsCSV(filtered, workflows)}
            disabled={loading || filtered.length === 0}
            className="chip text-xs transition hover:border-[var(--green)] hover:text-[var(--green)] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => exportDashboardPDF(filtered, workflows)}
            disabled={loading || filtered.length === 0}
            className="chip text-xs transition hover:border-[var(--blue)] hover:text-[var(--blue)] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Severity Distribution">
          {loading ? (
            <LoadingPlaceholder label="Loading…" />
          ) : (
            <BarChart data={getSeverityBreakdown(filtered)} />
          )}
        </Panel>
        <Panel title="Risk Distribution">
          {loading ? (
            <LoadingPlaceholder label="Loading…" />
          ) : (
            <BarChart data={getRiskDistribution(filtered)} />
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Workflow Risk Comparison">
          {loading ? (
            <LoadingPlaceholder label="Loading…" />
          ) : (
            <ProgressList data={getWorkflowRisk(filtered, workflows)} maxValue={30} />
          )}
        </Panel>
        <Panel title="Impact vs Severity">
          {loading ? (
            <LoadingPlaceholder label="Loading…" />
          ) : (
            <ScatterPlot points={getScatterPoints(filtered)} />
          )}
        </Panel>
      </div>
    </div>
  );
}
