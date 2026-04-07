import { Panel } from "@/components/ui/panel";

export default function SettingsPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title="Platform Settings" eyebrow="Security Architecture">
        <div className="space-y-3 text-[13px] leading-relaxed text-slate-400">
          <p>JWT-backed sessions with backend-enforced visibility are active.</p>
          <p>Environment-backed secrets and schema validation belong to the backend layer.</p>
          <p>Frontend markdown rendering and deeper workspace controls can be extended next.</p>
        </div>
      </Panel>
      <Panel title="V1 Notes" eyebrow="Roadmap Alignment">
        <div className="space-y-3 text-[13px] leading-relaxed text-slate-400">
          <p>V1 focuses on auth, organisations, workflows, incident logging, and analytics.</p>
          <p>Exports, maturity score, and richer incident detail views fit naturally in the next iteration.</p>
        </div>
      </Panel>
    </div>
  );
}
