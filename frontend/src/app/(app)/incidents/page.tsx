"use client";

import { useEffect, useState } from "react";
import { LogIncidentModal } from "@/components/incidents/log-incident-modal";
import { Panel } from "@/components/ui/panel";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import {
  filterIncidents,
  formatDate,
  statusColors,
} from "@/lib/fowas";
import { getIncidents, getWorkflows, updateIncident } from "@/services/api";
import type { Incident, Status, Workflow } from "@/types";

export default function IncidentsPage() {
  const { filters, setWorkflows: setGlobalWorkflows } = useGlobalFilters();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [incidentData, workflowData] = await Promise.all([
          getIncidents(),
          getWorkflows(),
        ]);

        setIncidents(incidentData);
        setWorkflows(workflowData);
        setGlobalWorkflows(workflowData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load incidents");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [setGlobalWorkflows]);

  async function handleStatusChange(incidentId: string, status: Status) {
    setUpdatingId(incidentId);
    setError(null);

    try {
      const updated = await updateIncident(incidentId, { status });
      setIncidents((current) =>
        current.map((incident) => (incident.id === incidentId ? updated : incident)),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "Unable to update incident",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredIncidents = filterIncidents(incidents, filters);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-5xl font-bold uppercase tracking-tight text-white">
            ACTIVE_INCIDENTS
          </h1>
          <span className="chip mono text-xs uppercase tracking-[0.22em]">
            Range: {filters.dateRange}d
          </span>
          {filters.severities.map((severity) => (
            <span key={severity} className="chip mono text-xs uppercase tracking-[0.22em]">
              Severity: {severity}
            </span>
          ))}
          {filters.workflowIds.length > 0 ? (
            <span className="chip mono text-xs uppercase tracking-[0.22em]">
              Workflows: {filters.workflowIds.length}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <span className="mono text-xs uppercase tracking-[0.28em] text-slate-500">
            Auto-refresh: 30s
          </span>
          <button type="button" onClick={() => setModalOpen(true)} className="fowas-button px-5 py-3">
            Log Incident
          </button>
        </div>
      </section>

      <Panel>
        {error ? <p className="mb-4 text-sm text-red-200">{error}</p> : null}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-white/8 bg-white/[0.03]">
              <tr className="mono text-xs uppercase tracking-[0.22em] text-slate-500">
                <th className="px-5 py-4">#</th>
                <th className="px-5 py-4">Title</th>
                <th className="px-5 py-4">Severity</th>
                <th className="px-5 py-4">Risk Score</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Workflow</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Update</th>
                <th className="px-5 py-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map((incident, index) => (
                <tr key={incident.id} className="border-b border-white/6 hover:bg-white/[0.02]">
                  <td className="mono px-5 py-5 text-xs uppercase tracking-[0.2em] text-slate-500">
                    INC-{String(index + 8801)}
                  </td>
                  <td className="px-5 py-5 text-white">{incident.title}</td>
                  <td className="px-5 py-5">
                    <span
                      className="mono rounded-md border px-3 py-1 text-xs uppercase tracking-[0.18em]"
                      style={{
                        color:
                          incident.severity === "HIGH"
                            ? "#ff5757"
                            : incident.severity === "MEDIUM"
                              ? "#ffb11a"
                              : "#28d26f",
                        borderColor:
                          incident.severity === "HIGH"
                            ? "rgba(255,87,87,0.45)"
                            : incident.severity === "MEDIUM"
                              ? "rgba(255,177,26,0.45)"
                              : "rgba(40,210,111,0.45)",
                      }}
                    >
                      {incident.severity}
                    </span>
                  </td>
                  <td className="mono px-5 py-5 text-sm text-white">
                    {incident.risk_score ?? "--"}
                  </td>
                  <td className="mono px-5 py-5 text-xs uppercase tracking-[0.18em] text-slate-300">
                    {incident.main_category}
                  </td>
                  <td className="mono px-5 py-5 text-xs uppercase tracking-[0.18em] text-slate-300">
                    {workflows.find((workflow) => workflow.id === incident.workflow_id)?.name ?? "--"}
                  </td>
                  <td className="px-5 py-5">
                    <span
                      className="mono rounded-md border px-3 py-1 text-xs uppercase tracking-[0.18em]"
                      style={{
                        color: statusColors[incident.status],
                        borderColor:
                          incident.status === "OPEN"
                            ? "rgba(68,132,255,0.45)"
                            : incident.status === "INVESTIGATING"
                              ? "rgba(255,177,26,0.45)"
                              : "rgba(40,210,111,0.45)",
                      }}
                    >
                      {incident.status}
                    </span>
                  </td>
                  <td className="px-5 py-5">
                    <select
                      value={incident.status}
                      onChange={(event) =>
                        void handleStatusChange(incident.id, event.target.value as Status)
                      }
                      disabled={updatingId === incident.id}
                      className="fowas-input min-w-[170px] py-2 text-xs"
                    >
                      {["OPEN", "INVESTIGATING", "RESOLVED"].map((status) => (
                        <option key={status} value={status}>
                          {updatingId === incident.id && incident.status === status
                            ? "Updating..."
                            : status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="mono px-5 py-5 text-xs uppercase tracking-[0.18em] text-slate-500">
                    {formatDate(incident.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filteredIncidents.length === 0 ? (
          <p className="mt-5 text-sm text-slate-500">
            No incidents found in the selected scope. Log one to activate the queue.
          </p>
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
