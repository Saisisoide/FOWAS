"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createIncident } from "@/services/api";
import {
  categoryOptions,
  severityOptions,
  statusColors,
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
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#0f141d] p-6 shadow-[0_40px_90px_rgba(0,0,0,0.5)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mono text-xs uppercase tracking-[0.35em] text-[#4f8cff]">
              New Incident
            </p>
            <h3 className="mt-3 text-3xl font-bold uppercase tracking-[0.04em] text-white">
              Log a failure signal
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300"
          >
            Close
          </button>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          {!hasWorkflows ? (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/8 px-4 py-4 md:col-span-2">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="mono text-xs uppercase tracking-[0.24em] text-amber-200">
                    Workflow Required
                  </p>
                  <p className="mt-2 text-sm text-amber-100">
                    There are no workflows available for this account yet, so the incident
                    cannot be attached to an operational scope.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push("/workflows");
                  }}
                  className="fowas-button-secondary rounded-xl px-4 py-3 text-sm font-semibold"
                >
                  Create Workflow
                </button>
              </div>
            </div>
          ) : null}

          <label className="space-y-2 md:col-span-2">
            <span className="mono text-xs uppercase tracking-[0.24em] text-slate-400">
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
            <span className="mono text-xs uppercase tracking-[0.24em] text-slate-400">
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
            <span className="mono text-xs uppercase tracking-[0.24em] text-slate-400">
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
            <span className="mono text-xs uppercase tracking-[0.24em] text-slate-400">
              Severity
            </span>
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
          </label>

          <label className="space-y-2">
            <span className="mono text-xs uppercase tracking-[0.24em] text-slate-400">
              Impact (1-10)
            </span>
            <input
              value={impact}
              onChange={(event) => setImpact(Number(event.target.value))}
              type="number"
              min={1}
              max={10}
              className="fowas-input w-full"
            />
          </label>

          <label className="space-y-2">
            <span className="mono text-xs uppercase tracking-[0.24em] text-slate-400">
              Category
            </span>
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
          </label>

          <label className="space-y-2">
            <span className="mono text-xs uppercase tracking-[0.24em] text-slate-400">
              Subcategory
            </span>
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
          </label>

          <label className="space-y-2">
            <span className="mono text-xs uppercase tracking-[0.24em] text-slate-400">
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
              <p className="text-xs text-slate-500">
                Personal workflows cannot use organisation visibility, so this incident will
                stay private to your account.
              </p>
            ) : null}
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="mono text-xs uppercase tracking-[0.24em] text-slate-400">
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
            <span className="mono text-xs uppercase tracking-[0.24em] text-slate-400">
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
            <span className="mono text-xs uppercase tracking-[0.24em] text-slate-400">
              Reflection Notes
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="fowas-input min-h-[160px] w-full resize-y"
              placeholder="Document root cause, the fix that was applied, and the preventive action."
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-200 md:col-span-2">
              {error}
            </div>
          ) : null}

          <div className="md:col-span-2 flex items-center justify-between gap-4 pt-2">
            <div className="mono text-xs uppercase tracking-[0.2em] text-slate-500">
              Status initializes as{" "}
              <span style={{ color: statusColors.OPEN }}>OPEN</span>
            </div>
            <button
              type="submit"
              disabled={loading || !hasWorkflows}
              className="fowas-button px-5 py-3"
            >
              {loading ? "Logging..." : "Log Incident"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
