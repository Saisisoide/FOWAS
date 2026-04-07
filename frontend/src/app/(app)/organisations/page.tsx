"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/panel";
import {
  createOrganisation,
  deleteOrganisation,
  getOrganisations,
  getOrgMembers,
  inviteOrgMember,
  removeMember,
  updateMemberRole,
} from "@/services/api";
import type { OrgMember } from "@/services/api";
import type { Organisation } from "@/types";

const ROLE_OPTIONS = ["OWNER", "ADMIN", "MEMBER", "VIEWER"] as const;

export default function OrganisationsPage() {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);

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
      setError(submissionError instanceof Error ? submissionError.message : "Unable to create organisation");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteOrg(orgId: string) {
    if (!confirm("Delete this organisation? This cannot be undone.")) return;
    try {
      await deleteOrganisation(orgId);
      setOrganisations((current) => current.filter((o) => o.id !== orgId));
      if (expandedOrg === orgId) setExpandedOrg(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete organisation");
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
          <p className="text-[13px] text-slate-500">
            Organisations define the sharing boundary for workflows, incidents, and analytics.
          </p>
          {error ? (
            <div className="rounded-[var(--radius-md)] border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}
          <button type="submit" disabled={submitting} className="fowas-button px-5 py-2.5 text-[13px]">
            {submitting ? "Creating…" : "Create Organisation"}
          </button>
        </form>
      </Panel>

      <Panel title="Organisation Directory" eyebrow="Current Memberships">
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="skeleton h-20 w-full" />
              ))}
            </div>
          ) : organisations.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-500">No organisations yet.</p>
              <p className="mt-1 text-xs text-slate-600">Create one to unlock shared workflows and visibility controls.</p>
            </div>
          ) : (
            organisations.map((org) => (
              <div key={org.id} className="rounded-[var(--radius-lg)] border border-white/8 bg-white/[0.025] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{org.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Created {new Date(org.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedOrg(expandedOrg === org.id ? null : org.id)}
                      className="chip text-xs"
                    >
                      {expandedOrg === org.id ? "Hide" : "Members"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteOrg(org.id)}
                      className="chip text-xs transition hover:border-[var(--red)] hover:text-[var(--red)]"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {expandedOrg === org.id ? (
                  <OrgMemberPanel orgId={org.id} />
                ) : null}
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}

function OrgMemberPanel({ orgId }: { orgId: string }) {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMembers() {
    setLoading(true);
    try {
      setMembers(await getOrgMembers(orgId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load members");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMembers();
  }, [orgId]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setError(null);
    try {
      await inviteOrgMember(orgId, inviteEmail, inviteRole);
      setInviteEmail("");
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to invite");
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(userId: string, role: string) {
    try {
      await updateMemberRole(orgId, userId, role);
      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, role } : m)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update role");
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm("Remove this member?")) return;
    try {
      await removeMember(orgId, userId);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove member");
    }
  }

  return (
    <div className="mt-4 space-y-4 border-t border-white/8 pt-4">
      {error ? (
        <div className="rounded-[var(--radius-md)] border border-red-500/20 bg-red-500/8 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      ) : null}

      {/* Invite form */}
      <form className="flex flex-wrap items-end gap-2" onSubmit={handleInvite}>
        <input
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          type="email"
          placeholder="user@email.com"
          className="fowas-input flex-1 py-2 text-xs"
          required
        />
        <select
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value)}
          className="fowas-input py-2 text-xs"
        >
          {ROLE_OPTIONS.filter((r) => r !== "OWNER").map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button type="submit" disabled={inviting} className="fowas-button px-3 py-2 text-xs">
          {inviting ? "Inviting…" : "Invite"}
        </button>
      </form>

      {/* Member list */}
      {loading ? (
        <div className="skeleton h-12 w-full" />
      ) : members.length === 0 ? (
        <p className="text-xs text-slate-500">No members found.</p>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.user_id}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-white/[0.02] px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white truncate">{member.full_name}</p>
                <p className="text-xs text-slate-500 truncate">{member.email}</p>
              </div>
              <select
                value={member.role}
                onChange={(e) => void handleRoleChange(member.user_id, e.target.value)}
                className="fowas-input py-1 text-xs"
                disabled={member.role === "OWNER"}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {member.role !== "OWNER" ? (
                <button
                  type="button"
                  onClick={() => void handleRemove(member.user_id)}
                  className="text-xs text-slate-500 hover:text-[var(--red)] transition-colors"
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
