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
import type { Incident, Workflow } from "@/types";

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
      <div>
        <p className="mono text-xs uppercase tracking-[0.34em] text-[#4f8cff]">
          Analytics Layer
        </p>
        <h1 className="mt-3 text-5xl font-bold uppercase tracking-tight text-white">
          Quantified Reliability
        </h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Severity Distribution">
          {loading ? (
            <p className="mono text-sm uppercase tracking-[0.2em] text-slate-500">Loading...</p>
          ) : (
            <BarChart data={getSeverityBreakdown(filtered)} />
          )}
        </Panel>
        <Panel title="Risk Distribution">
          {loading ? (
            <p className="mono text-sm uppercase tracking-[0.2em] text-slate-500">Loading...</p>
          ) : (
            <BarChart data={getRiskDistribution(filtered)} />
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Workflow Risk Comparison">
          {loading ? (
            <p className="mono text-sm uppercase tracking-[0.2em] text-slate-500">Loading...</p>
          ) : (
            <ProgressList data={getWorkflowRisk(filtered, workflows)} maxValue={30} />
          )}
        </Panel>
        <Panel title="Impact vs Severity">
          {loading ? (
            <p className="mono text-sm uppercase tracking-[0.2em] text-slate-500">Loading...</p>
          ) : (
            <ScatterPlot points={getScatterPoints(filtered)} />
          )}
        </Panel>
      </div>
    </div>
  );
}
