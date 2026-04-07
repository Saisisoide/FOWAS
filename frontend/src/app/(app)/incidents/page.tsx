"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogIncidentModal } from "@/components/incidents/log-incident-modal";
import { Panel } from "@/components/ui/panel";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import {
  filterIncidents,
  formatDate,
  severityColors,
  statusColors,
} from "@/lib/fowas";
import { getIncidents, getWorkflows, updateIncident } from "@/services/api";
import { exportIncidentsCSV } from "@/lib/export";
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
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Incidents
          </h1>
          <span className="chip text-xs">
            {filters.dateRange}d range
          </span>
          {filters.severities.map((severity) => (
            <span key={severity} className="chip text-xs">
              {severity}
            </span>
          ))}
          {filters.workflowIds.length > 0 ? (
            <span className="chip text-xs">
              {filters.workflowIds.length} workflow{filters.workflowIds.length > 1 ? "s" : ""}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => exportIncidentsCSV(filteredIncidents, workflows)}
            disabled={loading || filteredIncidents.length === 0}
            className="chip text-xs transition hover:border-[var(--green)] hover:text-[var(--green)] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
          <button type="button" onClick={() => setModalOpen(true)} className="fowas-button px-4 py-2.5 text-[13px]">
            Log Incident
          </button>
        </div>
      </section>

      <Panel>
        {error ? (
          <div className="mb-4 rounded-[var(--radius-md)] border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-white/8 text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-4 pb-3 pt-1">#</th>
                <th className="px-4 pb-3 pt-1">Title</th>
                <th className="px-4 pb-3 pt-1">Severity</th>
                <th className="px-4 pb-3 pt-1">Risk</th>
                <th className="px-4 pb-3 pt-1">Category</th>
                <th className="px-4 pb-3 pt-1">Workflow</th>
                <th className="px-4 pb-3 pt-1">Status</th>
                <th className="px-4 pb-3 pt-1">Update</th>
                <th className="px-4 pb-3 pt-1">Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map((incident, index) => (
                <tr key={incident.id} className="border-b border-white/[0.04] transition hover:bg-white/[0.02]">
                  <td className="mono px-4 py-3.5 text-xs text-slate-600">
                    {String(index + 1).padStart(3, "0")}
                  </td>
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/incidents/${incident.id}`}
                      className="text-sm font-medium text-white hover:text-[var(--blue)] transition-colors"
                    >
                      {incident.title}
                      {incident.notes && incident.notes.trim() ? (
                        <span className="ml-1.5 text-[10px] text-slate-500" title="Has reflection notes">✎</span>
                      ) : null}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="badge" style={{ color: severityColors[incident.severity] }}>
                      {incident.severity}
                    </span>
                  </td>
                  <td className="mono px-4 py-3.5 text-sm tabular-nums text-white">
                    {incident.risk_score ?? "—"}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-400">
                    {incident.main_category}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-400">
                    {workflows.find((workflow) => workflow.id === incident.workflow_id)?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="badge" style={{ color: statusColors[incident.status] }}>
                      {incident.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <select
                      value={incident.status}
                      onChange={(event) =>
                        void handleStatusChange(incident.id, event.target.value as Status)
                      }
                      disabled={updatingId === incident.id}
                      className="fowas-input min-w-[150px] py-2 text-xs"
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
                  <td className="px-4 py-3.5 text-xs text-slate-500">
                    {formatDate(incident.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filteredIncidents.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-500">
              No incidents found in the selected scope.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Log one to activate the queue.
            </p>
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
