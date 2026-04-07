"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/panel";
import {
  createWorkflow,
  deleteWorkflow,
  getOrganisations,
  getWorkflows,
  updateWorkflow,
} from "@/services/api";
import type { Organisation, Workflow, WorkflowVisibility } from "@/types";

const visibilityOptions: WorkflowVisibility[] = ["PRIVATE", "ORGANISATION", "PUBLIC"];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [organisationId, setOrganisationId] = useState("");
  const [visibility, setVisibility] = useState<WorkflowVisibility>("PRIVATE");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [workflowData, organisationData] = await Promise.all([
          getWorkflows(),
          getOrganisations(),
        ]);
        setWorkflows(workflowData);
        setOrganisations(organisationData);
        if (organisationData.length > 0) {
          setOrganisationId((current) => current || organisationData[0].id);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load workflows");
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const workflow = await createWorkflow({
        name,
        description: description || undefined,
        organisation_id: organisationId || undefined,
        visibility,
      });
      setWorkflows((current) => [workflow, ...current]);
      setName("");
      setDescription("");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to create workflow");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(workflowId: string) {
    if (!confirm("Delete this workflow? All associated incidents will be orphaned.")) return;
    setError(null);
    try {
      await deleteWorkflow(workflowId);
      setWorkflows((current) => current.filter((w) => w.id !== workflowId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete workflow");
    }
  }

  async function handleUpdate(workflowId: string, updates: { name?: string; description?: string; visibility?: string }) {
    setError(null);
    try {
      const updated = await updateWorkflow(workflowId, updates);
      setWorkflows((current) =>
        current.map((w) => (w.id === workflowId ? updated : w)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update workflow");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Panel title="Create Workflow" eyebrow="Reliability Scope">
        <form className="space-y-4" onSubmit={handleCreate}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="fowas-input w-full"
            placeholder="Workflow name"
            required
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="fowas-input min-h-[140px] w-full resize-y"
            placeholder="Describe the service, pipeline, or operational boundary."
          />
          <select
            value={organisationId}
            onChange={(event) => setOrganisationId(event.target.value)}
            className="fowas-input w-full"
          >
            <option value="">Personal workflow</option>
            {organisations.map((organisation) => (
              <option key={organisation.id} value={organisation.id}>
                {organisation.name}
              </option>
            ))}
          </select>
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as WorkflowVisibility)}
            className="fowas-input w-full"
          >
            {visibilityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {error ? (
            <div className="rounded-[var(--radius-md)] border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}
          <button type="submit" disabled={submitting} className="fowas-button px-5 py-2.5 text-[13px]">
            {submitting ? "Creating…" : "Create Workflow"}
          </button>
        </form>
      </Panel>

      <Panel title="Workflow Registry" eyebrow="Visible Workstreams">
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="skeleton h-20 w-full" />
              ))}
            </div>
          ) : workflows.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-500">No workflows yet.</p>
              <p className="mt-1 text-xs text-slate-600">Create one to start grouping incidents by operational domain.</p>
            </div>
          ) : (
            workflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onDelete={() => void handleDelete(workflow.id)}
                onUpdate={(updates) => void handleUpdate(workflow.id, updates)}
              />
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}

function WorkflowCard({
  workflow,
  onDelete,
  onUpdate,
}: {
  workflow: Workflow;
  onDelete: () => void;
  onUpdate: (updates: { name?: string; description?: string; visibility?: string }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(workflow.name);
  const [editDesc, setEditDesc] = useState(workflow.description ?? "");
  const [editVis, setEditVis] = useState(workflow.visibility);

  function handleSave() {
    onUpdate({
      name: editName !== workflow.name ? editName : undefined,
      description: editDesc !== (workflow.description ?? "") ? editDesc : undefined,
      visibility: editVis !== workflow.visibility ? editVis : undefined,
    });
    setEditing(false);
  }

  function handleCancel() {
    setEditName(workflow.name);
    setEditDesc(workflow.description ?? "");
    setEditVis(workflow.visibility);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--blue)]/20 bg-[var(--blue)]/5 p-4 space-y-3">
        <input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="fowas-input w-full text-sm"
        />
        <textarea
          value={editDesc}
          onChange={(e) => setEditDesc(e.target.value)}
          className="fowas-input w-full text-sm min-h-[80px] resize-y"
          placeholder="Description"
        />
        <select
          value={editVis}
          onChange={(e) => setEditVis(e.target.value as WorkflowVisibility)}
          className="fowas-input w-full text-sm"
        >
          {(["PRIVATE", "ORGANISATION", "PUBLIC"] as const).map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button type="button" onClick={handleSave} className="fowas-button px-3 py-2 text-xs">
            Save
          </button>
          <button type="button" onClick={handleCancel} className="chip text-xs">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-white/8 bg-white/[0.025] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white">{workflow.name}</h3>
          <p className="mt-1 text-[13px] text-slate-500">
            {workflow.description || "No description recorded."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip text-xs">{workflow.visibility}</span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="chip text-xs transition hover:border-[var(--blue)] hover:text-[var(--blue)]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="chip text-xs transition hover:border-[var(--red)] hover:text-[var(--red)]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
