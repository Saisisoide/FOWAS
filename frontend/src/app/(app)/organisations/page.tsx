"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/panel";
import { createOrganisation, getOrganisations } from "@/services/api";
import type { Organisation } from "@/types";

export default function OrganisationsPage() {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      setOrganisations(await getOrganisations());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load organisations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const organisation = await createOrganisation({ name });
      setOrganisations((current) => [organisation, ...current]);
      setName("");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to create organisation",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Panel title="Create Organisation" eyebrow="Multi-Tenant Layer">
        <form className="space-y-4" onSubmit={handleCreate}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="fowas-input w-full"
            placeholder="Organisation name"
            required
          />
          <p className="text-sm text-slate-400">
            Organisations define the sharing boundary for workflows, incidents, and analytics.
          </p>
          {error ? <p className="text-sm text-red-200">{error}</p> : null}
          <button type="submit" disabled={submitting} className="fowas-button px-5 py-3">
            {submitting ? "Creating..." : "Create Organisation"}
          </button>
        </form>
      </Panel>

      <Panel title="Organisation Directory" eyebrow="Current Memberships">
        <div className="space-y-4">
          {loading ? (
            <p className="mono text-sm uppercase tracking-[0.2em] text-slate-500">
              Loading organisations...
            </p>
          ) : organisations.length === 0 ? (
            <p className="text-sm text-slate-500">
              No organisations yet. Create one to unlock shared workflows and visibility controls.
            </p>
          ) : (
            organisations.map((organisation) => (
              <div key={organisation.id} className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-semibold uppercase tracking-[0.04em] text-white">
                      {organisation.name}
                    </h3>
                    <p className="mono mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                      Created {new Date(organisation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="chip mono text-xs uppercase tracking-[0.2em]">
                    Active
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}
