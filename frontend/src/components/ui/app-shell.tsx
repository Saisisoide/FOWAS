"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import { initials } from "@/lib/fowas";
import { severityOptions } from "@/lib/fowas";
import {
  AnalyticsIcon,
  BellIcon,
  DashboardIcon,
  HelpIcon,
  IncidentIcon,
  OrganisationIcon,
  PlusIcon,
  ProfileIcon,
  SearchIcon,
  SettingsIcon,
  TerminalIcon,
  WorkflowIcon,
} from "@/components/ui/icons";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/incidents", label: "Incidents", icon: IncidentIcon },
  { href: "/workflows", label: "Workflows", icon: WorkflowIcon },
  { href: "/analytics", label: "Analytics", icon: AnalyticsIcon },
  { href: "/organisations", label: "Organizations", icon: OrganisationIcon },
];

const footerItems = [
  { href: "/settings", label: "Settings", icon: SettingsIcon },
  { href: "/profile", label: "Profile", icon: ProfileIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { filters, setFilters, workflows } = useGlobalFilters();
  const [activeFilterPanel, setActiveFilterPanel] = useState<
    "global" | "date" | "severity" | "workflow" | null
  >(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#060810" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="skeleton h-1.5 w-32 rounded-full" />
          <p className="mono text-xs uppercase tracking-widest text-slate-600">
            Loading…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="shell-background min-h-screen text-white">
      <div className="mx-auto flex min-h-screen max-w-[1920px]">

        {/* ── Sidebar ── */}
        <aside className="hidden w-[220px] shrink-0 flex-col border-r border-white/[0.06] bg-[#070a12] xl:flex">
          <div className="px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--blue)]/15 text-[var(--blue)]">
                <TerminalIcon />
              </div>
              <div>
                <p className="text-[15px] font-bold tracking-tight text-white">
                  FOWAS
                </p>
                <p className="mono text-[9px] uppercase tracking-[0.18em] text-slate-600">
                  Reliability Intelligence
                </p>
              </div>
            </div>
          </div>

          <div className="px-4">
            <Link
              href="/incidents"
              className="fowas-button flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[12px]"
            >
              <PlusIcon />
              Log Incident
            </Link>
          </div>

          <nav className="mt-5 flex-1 space-y-0.5 px-3">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-all ${
                    active
                      ? "bg-white/[0.06] text-white"
                      : "text-slate-500 hover:bg-white/[0.03] hover:text-slate-300"
                  }`}
                >
                  <span className={active ? "text-[var(--blue)]" : ""}>
                    <Icon />
                  </span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/[0.06] px-3 py-3 space-y-0.5">
            {footerItems.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all ${
                    active
                      ? "bg-white/[0.06] text-white"
                      : "text-slate-500 hover:bg-white/[0.03] hover:text-slate-300"
                  }`}
                >
                  <Icon />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* ── Top Bar ── */}
          <header className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-3 md:px-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { id: "global", label: "Filters" },
                { id: "date", label: "Date" },
                { id: "severity", label: "Severity" },
                { id: "workflow", label: "Workflow" },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() =>
                    setActiveFilterPanel((current) =>
                      current === item.id ? null : (item.id as typeof activeFilterPanel),
                    )
                  }
                  className={`shrink-0 rounded-md px-2.5 py-1.5 text-[11px] font-medium tracking-wide transition-all ${
                    activeFilterPanel === item.id
                      ? "bg-[var(--blue)]/10 text-[var(--blue)]"
                      : "text-slate-600 hover:text-slate-400"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:flex-nowrap">
              <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-white/[0.06] bg-black/30 px-3 py-2 text-slate-500">
                <SearchIcon />
                <input
                  value={filters.search}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, search: event.target.value }))
                  }
                  placeholder="Search…"
                  className="w-full bg-transparent text-[13px] text-slate-300 outline-none placeholder:text-slate-600"
                />
              </label>
              <button type="button" className="rounded-lg border border-white/[0.06] p-2 text-slate-600 transition hover:text-slate-300">
                <BellIcon />
              </button>
              <button type="button" className="rounded-lg border border-white/[0.06] p-2 text-slate-600 transition hover:text-slate-300">
                <HelpIcon />
              </button>
              <button
                type="button"
                onClick={() => { logout(); router.replace("/login"); }}
                className="flex items-center rounded-full border border-white/[0.06] bg-white/[0.02] p-1 transition hover:border-white/10"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-[11px] font-bold text-slate-900">
                  {initials(user.full_name)}
                </span>
              </button>
            </div>
          </header>

          {/* ── Filter Panel ── */}
          {activeFilterPanel ? (
            <div className="border-b border-white/[0.06] bg-[#080a12] px-5 py-3 md:px-6 fade-in">
              {activeFilterPanel === "global" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFilters({ dateRange: 30, severities: [], workflowIds: [], riskLevels: [], tag: null, search: "" })
                    }
                    className="chip text-[11px]"
                  >
                    Reset All
                  </button>
                  <span className="chip text-[11px]">{filters.dateRange}d</span>
                  <span className="chip text-[11px]">Severity: {filters.severities.length || "All"}</span>
                  <span className="chip text-[11px]">Workflows: {filters.workflowIds.length || "All"}</span>
                </div>
              ) : null}
              {activeFilterPanel === "date" ? (
                <div className="flex flex-wrap gap-2">
                  {[7, 14, 30, 90].map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setFilters((c) => ({ ...c, dateRange: range as typeof c.dateRange }))}
                      className={`chip text-[11px] ${filters.dateRange === range ? "border-[var(--blue)]/40 text-white bg-[var(--blue)]/8" : ""}`}
                    >
                      {range}d
                    </button>
                  ))}
                </div>
              ) : null}
              {activeFilterPanel === "severity" ? (
                <div className="flex flex-wrap gap-2">
                  {severityOptions.map((severity) => (
                    <button
                      key={severity}
                      type="button"
                      onClick={() =>
                        setFilters((c) => ({
                          ...c,
                          severities: c.severities.includes(severity)
                            ? c.severities.filter((s) => s !== severity)
                            : [...c.severities, severity],
                        }))
                      }
                      className={`chip text-[11px] ${filters.severities.includes(severity) ? "border-[var(--blue)]/40 text-white bg-[var(--blue)]/8" : ""}`}
                    >
                      {severity}
                    </button>
                  ))}
                </div>
              ) : null}
              {activeFilterPanel === "workflow" ? (
                <div className="flex flex-wrap gap-2">
                  {workflows.length === 0 ? (
                    <p className="text-[12px] text-slate-600">No workflows available.</p>
                  ) : (
                    workflows.map((wf) => (
                      <button
                        key={wf.id}
                        type="button"
                        onClick={() =>
                          setFilters((c) => ({
                            ...c,
                            workflowIds: c.workflowIds.includes(wf.id)
                              ? c.workflowIds.filter((id) => id !== wf.id)
                              : [...c.workflowIds, wf.id],
                          }))
                        }
                        className={`chip text-[11px] ${filters.workflowIds.includes(wf.id) ? "border-[var(--blue)]/40 text-white bg-[var(--blue)]/8" : ""}`}
                      >
                        {wf.name}
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          <main className="flex-1 overflow-y-auto p-4 md:p-6 xl:p-7">{children}</main>
        </div>
      </div>
    </div>
  );
}
