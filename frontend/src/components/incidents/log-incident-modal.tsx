"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { createIncident } from "@/services/api";
import {
  categoryOptions,
  categoryGuidance,
  getImpactGuidance,
  severityOptions,
  severityGuidance,
  statusColors,
  subcategoryGuidance,
  subcategoryMap,
} from "@/lib/fowas";
import type { Incident, IncidentVisibility, Workflow } from "@/types";

const visibilityOptions: IncidentVisibility[] = ["PRIVATE", "ORGANISATION", "PUBLIC"];

interface LogIncidentModalProps {
  open: boolean;
  workflows: Workflow[];
  incidents: Incident[];
  onClose: () => void;
  onCreated: (incident: Incident) => void;
}

function FieldHint({
  title,
  lines,
}: {
  title: string;
  lines: string[];
}) {
  const tooltipId = useId();

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-describedby={tooltipId}
        aria-label={`About ${title}`}
        className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-semibold text-slate-400 transition hover:border-[var(--blue)]/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-[var(--blue)]/30"
      >
        ?
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 hidden w-72 -translate-x-1/2 rounded-[var(--radius-lg)] border border-white/[0.08] bg-[#0a0e18]/95 p-3.5 text-left text-[12px] normal-case tracking-normal text-slate-200 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-sm group-hover:block group-focus-within:block"
      >
        <span className="mono text-[10px] uppercase tracking-widest text-[var(--blue-muted)]">
          {title}
        </span>
        <span className="mt-2 block space-y-1.5">
          {lines.map((line) => (
            <span key={line} className="block leading-[1.6] text-slate-300">
              {line}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}

function LabelWithHint({
  label,
  hintTitle,
  hintLines,
}: {
  label: string;
  hintTitle: string;
  hintLines: string[];
}) {
  return (
    <span className="flex items-center gap-2 text-xs font-medium text-slate-400">
      <span>{label}</span>
      <FieldHint title={hintTitle} lines={hintLines} />
    </span>
  );
}

export function LogIncidentModal({
  open,
  workflows,
  incidents,
  onClose,
  onCreated,
}: LogIncidentModalProps) {
  const router = useRouter();
  const [workflowId, setWorkflowId] = useState("");
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<(typeof severityOptions)[number]>("HIGH");
  const [impact, setImpact] = useState(7);
  const [engineer, setEngineer] = useState("");
  const [category, setCategory] = useState<(typeof categoryOptions)[number]>("TECHNICAL");
  const [subcategory, setSubcategory] = useState(subcategoryMap.TECHNICAL[0]);
  const [visibility, setVisibility] =
    useState<(typeof visibilityOptions)[number]>("ORGANISATION");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [linkedTo, setLinkedTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasWorkflows = workflows.length > 0;
  const selectedWorkflow = workflows.find((workflow) => workflow.id === workflowId) ?? null;
  const canUseOrganisationVisibility = Boolean(selectedWorkflow?.organisation_id);

  useEffect(() => {
    if (workflows.length > 0 && !workflowId) {
      setWorkflowId(workflows[0].id);
    }
  }, [workflowId, workflows]);

  useEffect(() => {
    setSubcategory(subcategoryMap[category][0]);
  }, [category]);

  useEffect(() => {
    if (!canUseOrganisationVisibility && visibility === "ORGANISATION") {
      setVisibility("PRIVATE");
    }
  }, [canUseOrganisationVisibility, visibility]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasWorkflows || !workflowId) {
      setError("Create a workflow before logging an incident.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const incident = await createIncident({
        workflow_id: workflowId,
        title,
        severity,
        impact,
        engineer: engineer || undefined,
        main_category: category,
        sub_category: subcategory,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        notes: notes || undefined,
        linked_to: linkedTo || undefined,
        visibility,
      });

      onCreated(incident);
      onClose();
      setTitle("");
      setImpact(7);
      setEngineer("");
      setTags("");
      setNotes("");
      setLinkedTo("");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Unable to log incident",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[var(--radius-xl)] border border-white/[0.08] bg-[#0a0d16] p-6 shadow-[0_32px_70px_rgba(0,0,0,0.6)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mono text-[11px] uppercase tracking-widest text-[var(--blue-muted)]">
              New Incident
            </p>
            <h3 className="mt-2 text-xl font-bold tracking-tight text-white">
              Log a failure signal
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-md)] border border-white/10 px-3.5 py-2 text-sm text-slate-400 transition hover:border-white/20 hover:text-white"
          >
            Close
          </button>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          {!hasWorkflows ? (
            <div className="rounded-[var(--radius-lg)] border border-amber-400/20 bg-amber-400/8 px-4 py-4 md:col-span-2">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold text-amber-200">
                    Workflow Required
                  </p>
                  <p className="mt-1.5 text-[13px] text-amber-100/80">
                    No workflows available. Create one to attach this incident to an operational scope.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push("/workflows");
                  }}
                  className="fowas-button-secondary rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-medium"
                >
                  Create Workflow
                </button>
              </div>
            </div>
          ) : null}

          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-medium text-slate-400">
              Incident Title
            </span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="fowas-input w-full"
              placeholder="Database connection pool exhaustion"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-medium text-slate-400">
              Workflow
            </span>
            <select
              value={workflowId}
              onChange={(event) => setWorkflowId(event.target.value)}
              className="fowas-input w-full"
              disabled={!hasWorkflows}
              required
            >
              {!hasWorkflows ? (
                <option value="">No workflows available</option>
              ) : null}
              {workflows.map((workflow) => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-medium text-slate-400">
              Assigned Engineer
            </span>
            <input
              value={engineer}
              onChange={(event) => setEngineer(event.target.value)}
              className="fowas-input w-full"
              placeholder="On-call operator"
            />
          </label>

          <label className="space-y-2">
            <LabelWithHint
              label="Severity"
              hintTitle="Severity Guide"
              hintLines={[
                "Low: minor issue with limited disruption and a clear workaround.",
                "Medium: visible disruption affecting an important workflow, but not a total outage.",
                "High: critical failure that blocks core functionality or needs immediate escalation.",
              ]}
            />
            <select
              value={severity}
              onChange={(event) =>
                setSeverity(event.target.value as (typeof severityOptions)[number])
              }
              className="fowas-input w-full"
            >
              {severityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="text-[12px] leading-relaxed text-slate-500">{severityGuidance[severity]}</p>
          </label>

          <label className="space-y-2">
            <LabelWithHint
              label="Impact (1–10)"
              hintTitle="Impact Scale"
              hintLines={[
                "1–2: minimal inconvenience, little or no business effect.",
                "3–4: limited issue affecting a small feature, team, or short time window.",
                "5–6: moderate disruption affecting multiple users or an important workflow.",
                "7–8: major degradation with clear urgency and business impact.",
                "9–10: severe outage or widespread critical harm.",
              ]}
            />
            <input
              value={impact}
              onChange={(event) => setImpact(Number(event.target.value))}
              type="number"
              min={1}
              max={10}
              className="fowas-input w-full"
            />
            <p className="text-[12px] leading-relaxed text-slate-500">{getImpactGuidance(impact)}</p>
          </label>

          <label className="space-y-2">
            <LabelWithHint
              label="Category"
              hintTitle="Category Guide"
              hintLines={[
                "Technical: code, infrastructure, hardware, or platform faults.",
                "Operational: deployment, process, release, or configuration execution problems.",
                "Human: incidents triggered by manual action, oversight, or knowledge gaps.",
                "External: vendor, upstream, or third-party causes outside direct control.",
                "Systemic: design or architecture weaknesses that make incidents repeat.",
              ]}
            />
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as (typeof categoryOptions)[number])
              }
              className="fowas-input w-full"
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="text-[12px] leading-relaxed text-slate-500">{categoryGuidance[category]}</p>
          </label>

          <label className="space-y-2">
            <LabelWithHint
              label="Subcategory"
              hintTitle="Subcategory Guide"
              hintLines={subcategoryMap[category].map(
                (option) => `${option}: ${subcategoryGuidance[option]}`,
              )}
            />
            <select
              value={subcategory}
              onChange={(event) => setSubcategory(event.target.value)}
              className="fowas-input w-full"
            >
              {subcategoryMap[category].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="text-[12px] leading-relaxed text-slate-500">
              {subcategoryGuidance[subcategory]}
            </p>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-medium text-slate-400">
              Visibility
            </span>
            <select
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as (typeof visibilityOptions)[number])
              }
              className="fowas-input w-full"
            >
              {visibilityOptions
                .filter((option) => canUseOrganisationVisibility || option !== "ORGANISATION")
                .map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
                ))}
            </select>
            {!canUseOrganisationVisibility && hasWorkflows ? (
              <p className="text-[12px] text-slate-500">
                Personal workflows cannot use organisation visibility.
              </p>
            ) : null}
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-medium text-slate-400">
              Link to Parent Incident
            </span>
            <select
              value={linkedTo}
              onChange={(event) => setLinkedTo(event.target.value)}
              className="fowas-input w-full"
            >
              <option value="">No parent incident</option>
              {incidents.map((incident) => (
                <option key={incident.id} value={incident.id}>
                  {incident.title}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-medium text-slate-400">
              Tags
            </span>
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              className="fowas-input w-full"
              placeholder="deployment, auth, latency"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-medium text-slate-400">
              Reflection Notes
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="fowas-input min-h-[140px] w-full resize-y"
              placeholder="Document root cause, the fix that was applied, and the preventive action."
            />
          </label>

          {error ? (
            <div className="rounded-[var(--radius-md)] border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-300 md:col-span-2">
              {error}
            </div>
          ) : null}

          <div className="md:col-span-2 flex items-center justify-between gap-4 pt-2">
            <p className="text-xs text-slate-500">
              Status initializes as{" "}
              <span className="font-medium" style={{ color: statusColors.OPEN }}>OPEN</span>
            </p>
            <button
              type="submit"
              disabled={loading || !hasWorkflows}
              className="fowas-button px-5 py-2.5 text-[13px]"
            >
              {loading ? "Logging…" : "Log Incident"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
