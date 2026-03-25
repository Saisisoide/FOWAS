"use client";

import { Panel } from "@/components/ui/panel";
import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Panel title="Operator Profile" eyebrow="Authenticated User">
        <div className="space-y-3">
          <p className="text-4xl font-semibold uppercase tracking-[0.04em] text-white">
            {user?.full_name ?? "Operator"}
          </p>
          <p className="mono text-xs uppercase tracking-[0.24em] text-slate-400">
            {user?.email ?? "--"}
          </p>
        </div>
      </Panel>
      <Panel title="FOWAS Role">
        <div className="space-y-4 text-sm text-slate-300">
          <p>
            This profile is currently backed by the authenticated user record returned by
            the FastAPI session endpoint.
          </p>
          <p>
            A fuller profile surface can add organisation memberships, audit activity, and
            personal reliability views later.
          </p>
        </div>
      </Panel>
    </div>
  );
}
