"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/panel";
import {
  enrichIncident,
  formatDate,
  riskColors,
  severityColors,
  statusColors,
  categoryGuidance,
  subcategoryGuidance,
} from "@/lib/fowas";
import { getIncident, getIncidents, getWorkflows, updateIncident } from "@/services/api";
import type { Incident, Status, Workflow } from "@/types";

export default function IncidentDetailPage() {
  const params = useParams();
  const incidentId = params.id as string;

  const [incident, setIncident] = useState<Incident | null>(null);
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [inc, allInc, wf] = await Promise.all([
          getIncident(incidentId),
          getIncidents(),
          getWorkflows(),
        ]);
        setIncident(inc);
        setAllIncidents(allInc);
        setWorkflows(wf);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load incident");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [incidentId]);

  async function handleStatusChange(status: Status) {
    if (!incident) return;
    setUpdatingStatus(true);
    try {
      const updated = await updateIncident(incident.id, { status });
      setIncident(updated);
      setAllIncidents((prev) =>
        prev.map((i) => (i.id === updated.id ? updated : i)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update status");
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <div className="skeleton h-1.5 w-32 rounded-full" />
        <p className="text-xs text-slate-600">Loading incident…</p>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="space-y-4">
        <Link href="/incidents" className="text-sm text-slate-400 hover:text-white transition-colors">
          ← Back to incidents
        </Link>
        <Panel>
          <p className="text-sm text-red-300">{error ?? "Incident not found."}</p>
        </Panel>
      </div>
    );
  }

  const enriched = enrichIncident(incident);
  const riskScore = enriched.risk_score;
  const riskLevel = enriched.risk_level;
  const workflow = workflows.find((w) => w.id === incident.workflow_id);

  // Cause chain computation
  const parentIncident = incident.linked_to
    ? allIncidents.find((i) => i.id === incident.linked_to) ?? null
    : null;
  const childIncidents = allIncidents.filter(
    (i) => i.linked_to === incident.id,
  );

  // Timeline
  const createdAt = new Date(incident.created_at);
  const resolvedAt = incident.resolved_at
    ? new Date(incident.resolved_at)
    : null;
  const hoursOpen = resolvedAt
    ? (resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
    : (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

  // Severity multiplier for formula display
  const severityNum =
    incident.severity === "HIGH" ? 3 : incident.severity === "MEDIUM" ? 2 : 1;

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <Link
            href="/incidents"
            className="text-sm text-slate-500 hover:text-white transition-colors"
          >
            ← Back to incidents
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {incident.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{formatDate(incident.created_at)}</span>
            <span>·</span>
            <span>{workflow?.name ?? "Unknown workflow"}</span>
            <span>·</span>
            <span>{incident.main_category} › {incident.sub_category}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="badge text-[12px]"
            style={{ color: statusColors[incident.status] }}
          >
            {incident.status}
          </span>
          <select
            value={incident.status}
            onChange={(e) =>
              void handleStatusChange(e.target.value as Status)
            }
            disabled={updatingStatus}
            className="fowas-input py-2 text-xs"
          >
            {(["OPEN", "INVESTIGATING", "RESOLVED"] as const).map((s) => (
              <option key={s} value={s}>
                {updatingStatus ? "Updating…" : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Risk Panel */}
          <Panel title="Risk Assessment">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span
                  className="mono text-4xl font-bold tabular-nums"
                  style={{ color: riskColors[riskLevel] }}
                >
                  {riskScore}
                </span>
                <div className="flex-1 space-y-1">
                  <div className="h-2.5 rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(riskScore / 30) * 100}%`,
                        background: riskColors[riskLevel],
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>0</span>
                    <span>30</span>
                  </div>
                </div>
                <span
                  className="badge text-[12px]"
                  style={{ color: riskColors[riskLevel] }}
                >
                  {riskLevel}
                </span>
              </div>
              <p className="mono text-xs text-slate-500">
                {incident.severity} ({severityNum}) × Impact {incident.impact} ={" "}
                {riskScore}
              </p>
            </div>
          </Panel>

          {/* Cause Chain */}
          <Panel title="Cause Chain">
            {!parentIncident && childIncidents.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-sm text-slate-500">
                  No cause chain linked.
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Link incidents via the &quot;Parent Incident&quot; field when
                  logging to build failure propagation chains.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {parentIncident ? (
                  <div>
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                      Caused by
                    </p>
                    <CauseChainCard incident={parentIncident} prefix="▲" />
                  </div>
                ) : null}

                <div>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    This incident
                  </p>
                  <div className="rounded-[var(--radius-md)] border border-[var(--blue)]/20 bg-[var(--blue)]/[0.04] p-3">
                    <p className="text-sm font-medium text-white">
                      {incident.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      <span style={{ color: severityColors[incident.severity] }}>
                        {incident.severity}
                      </span>
                      {" · "}Risk {riskScore}
                      {" · "}
                      <span style={{ color: statusColors[incident.status] }}>
                        {incident.status}
                      </span>
                    </p>
                  </div>
                </div>

                {childIncidents.length > 0 ? (
                  <div>
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                      Downstream ({childIncidents.length})
                    </p>
                    <div className="space-y-2">
                      {childIncidents.map((child) => (
                        <CauseChainCard
                          key={child.id}
                          incident={child}
                          prefix="▼"
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Chain summary */}
                {(parentIncident || childIncidents.length > 0) ? (
                  <div className="mt-2 flex gap-4 border-t border-white/6 pt-3 text-xs text-slate-500">
                    <span>
                      Chain depth:{" "}
                      {(parentIncident ? 1 : 0) +
                        1 +
                        (childIncidents.length > 0 ? 1 : 0)}
                    </span>
                    <span>
                      Total chain risk:{" "}
                      {(parentIncident
                        ? enrichIncident(parentIncident).risk_score
                        : 0) +
                        riskScore +
                        childIncidents.reduce(
                          (s, c) => s + enrichIncident(c).risk_score,
                          0,
                        )}
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </Panel>

          {/* Reflection Notes */}
          <Panel title="Reflection Notes">
            {incident.notes && incident.notes.trim() ? (
              <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-300">
                {incident.notes}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-sm text-slate-500">
                  No reflection notes recorded.
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Add root cause analysis and preventive actions when resolving
                  this incident.
                </p>
              </div>
            )}
          </Panel>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Metadata */}
          <Panel title="Metadata">
            <div className="space-y-3">
              <MetaRow label="Workflow" value={workflow?.name ?? "—"} />
              <MetaRow label="Engineer" value={incident.engineer ?? "Unassigned"} />
              <MetaRow label="Category" value={incident.main_category} />
              <MetaRow label="Subcategory" value={incident.sub_category} />
              <MetaRow label="Visibility" value={incident.visibility} />
              <MetaRow
                label="Tags"
                value={
                  incident.tags.length > 0
                    ? incident.tags.map((t) => t.name).join(", ")
                    : "None"
                }
              />
            </div>
          </Panel>

          {/* Timeline */}
          <Panel title="Timeline">
            <div className="space-y-4">
              <TimelineStep
                label="Created"
                time={formatDate(incident.created_at)}
                active
              />
              {incident.status === "INVESTIGATING" ? (
                <TimelineStep label="Investigating" time="In progress" active />
              ) : null}
              {resolvedAt ? (
                <TimelineStep
                  label="Resolved"
                  time={formatDate(incident.resolved_at!)}
                  active
                />
              ) : (
                <TimelineStep
                  label="Pending Resolution"
                  time="—"
                  active={false}
                />
              )}
              <div className="border-t border-white/6 pt-3">
                <p className="text-xs text-slate-500">
                  {resolvedAt
                    ? `Resolved in ${hoursOpen.toFixed(1)} hours`
                    : `Open for ${hoursOpen.toFixed(1)} hours`}
                </p>
              </div>
            </div>
          </Panel>

          {/* Category guidance */}
          <Panel title="Classification Context">
            <div className="space-y-3 text-[13px] leading-relaxed text-slate-400">
              <p>
                <span className="font-medium text-slate-300">
                  {incident.main_category}:
                </span>{" "}
                {categoryGuidance[incident.main_category]}
              </p>
              <p>
                <span className="font-medium text-slate-300">
                  {incident.sub_category}:
                </span>{" "}
                {subcategoryGuidance[incident.sub_category] ?? "No guidance available."}
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className="text-sm text-slate-300 text-right">{value}</span>
    </div>
  );
}

function TimelineStep({
  label,
  time,
  active,
}: {
  label: string;
  time: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`h-2.5 w-2.5 rounded-full shrink-0 ${
          active ? "bg-[var(--blue)]" : "bg-white/10"
        }`}
      />
      <div className="flex-1">
        <p className={`text-sm ${active ? "text-white" : "text-slate-500"}`}>
          {label}
        </p>
        <p className="text-xs text-slate-500">{time}</p>
      </div>
    </div>
  );
}

function CauseChainCard({
  incident,
  prefix,
}: {
  incident: Incident;
  prefix: string;
}) {
  const enriched = enrichIncident(incident);
  return (
    <Link
      href={`/incidents/${incident.id}`}
      className="block rounded-[var(--radius-md)] border border-white/8 bg-white/[0.02] p-3 transition hover:border-white/15 hover:bg-white/[0.04]"
    >
      <p className="text-sm text-white">
        <span className="mr-1.5 text-slate-500">{prefix}</span>
        {incident.title}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        <span style={{ color: severityColors[incident.severity] }}>
          {incident.severity}
        </span>
        {" · "}Risk {enriched.risk_score}
        {" · "}
        <span style={{ color: statusColors[incident.status] }}>
          {incident.status}
        </span>
      </p>
    </Link>
  );
}
