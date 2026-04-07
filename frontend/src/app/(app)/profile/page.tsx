"use client";

import { Panel } from "@/components/ui/panel";
import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Panel title="Operator Profile" eyebrow="Authenticated User">
        <div className="space-y-2">
          <p className="text-2xl font-semibold tracking-tight text-white">
            {user?.full_name ?? "Operator"}
          </p>
          <p className="mono text-sm text-slate-400">
            {user?.email ?? "—"}
          </p>
        </div>
      </Panel>
      <Panel title="FOWAS Role">
        <div className="space-y-3 text-[13px] leading-relaxed text-slate-400">
          <p>
            This profile is backed by the authenticated user record returned by
            the FastAPI session endpoint.
          </p>
          <p>
            A fuller profile surface can add organisation memberships, audit activity, and
            personal reliability views in a future iteration.
          </p>
        </div>
      </Panel>
    </div>
  );
}
