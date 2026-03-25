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
  { href: "/profile", label: "User Profile", icon: ProfileIcon },
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="mono text-sm uppercase tracking-[0.35em] text-slate-500">
          Syncing operator session...
        </div>
      </div>
    );
  }

  return (
    <div className="shell-background min-h-screen p-3 text-white md:p-5">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1800px] overflow-hidden rounded-[2rem] border border-white/8 bg-[#090d13]">
        <aside className="hidden w-[260px] flex-col border-r border-white/8 bg-[#10141d] xl:flex">
          <div className="px-8 py-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4383ff] text-[#07111f]">
                <TerminalIcon />
              </div>
              <div>
                <p className="text-4xl font-bold uppercase leading-none tracking-tight text-white">
                  FOWAS
                </p>
                <p className="mono mt-1 text-xs uppercase tracking-[0.28em] text-slate-400">
                  Reliability
                </p>
                <p className="mono text-xs uppercase tracking-[0.28em] text-slate-500">
                  Cockpit
                </p>
              </div>
            </div>
          </div>

          <div className="px-6">
            <Link
              href="/incidents"
              className="fowas-button glow-blue flex items-center justify-center gap-3 rounded-2xl px-4 py-4 text-sm"
            >
              <PlusIcon />
              Log Incident
            </Link>
          </div>

          <nav className="mt-8 flex-1 space-y-2 px-4">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-4 rounded-r-2xl border-l-2 px-5 py-4 transition ${
                    active
                      ? "border-[#4484ff] bg-[#16233b] text-[#4c89ff]"
                      : "border-transparent text-slate-300 hover:bg-white/3 hover:text-white"
                  }`}
                >
                  <Icon />
                  <span className="mono text-[13px] uppercase tracking-[0.14em]">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/8 px-4 py-6">
            {footerItems.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-4 rounded-2xl px-5 py-4 transition ${
                    active
                      ? "bg-white/5 text-white"
                      : "text-slate-300 hover:bg-white/3 hover:text-white"
                  }`}
                >
                  <Icon />
                  <span className="mono text-[13px] uppercase tracking-[0.14em]">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex flex-col gap-4 border-b border-white/8 px-5 py-4 md:px-8 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3 overflow-x-auto">
              {[
                { id: "global", label: "Global Filters" },
                { id: "date", label: "Date Range" },
                { id: "severity", label: "Severity" },
                { id: "workflow", label: "Workflow" },
              ].map((item, index) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() =>
                    setActiveFilterPanel((current) =>
                      current === item.id ? null : (item.id as typeof activeFilterPanel),
                    )
                  }
                  className={`mono shrink-0 border-b-2 px-1 pb-3 text-xs uppercase tracking-[0.28em] ${
                    activeFilterPanel === item.id || (index === 0 && activeFilterPanel === null)
                      ? "border-[#4484ff] text-white"
                      : "border-transparent text-slate-500"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 xl:flex-nowrap">
              <label className="flex min-w-[280px] flex-1 items-center gap-3 rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-slate-400">
                <SearchIcon />
                <input
                  value={filters.search}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      search: event.target.value,
                    }))
                  }
                  placeholder="Search signals..."
                  className="mono w-full bg-transparent text-sm uppercase tracking-[0.18em] text-slate-300 outline-none placeholder:text-slate-600"
                />
              </label>
              <button
                type="button"
                className="rounded-full border border-white/10 p-3 text-slate-400 transition hover:border-white/20 hover:text-white"
              >
                <BellIcon />
              </button>
              <button
                type="button"
                className="rounded-full border border-white/10 p-3 text-slate-400 transition hover:border-white/20 hover:text-white"
              >
                <HelpIcon />
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.replace("/login");
                }}
                className="flex items-center gap-3 rounded-full border border-white/10 bg-white/4 px-2 py-2 text-left"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-slate-50 to-slate-300 text-sm font-bold text-slate-900">
                  {initials(user.full_name)}
                </span>
              </button>
            </div>
          </header>

          {activeFilterPanel ? (
            <div className="border-b border-white/8 bg-[#0d1118] px-5 py-4 md:px-8">
              {activeFilterPanel === "global" ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFilters({
                        dateRange: 30,
                        severities: [],
                        workflowIds: [],
                        riskLevels: [],
                        tag: null,
                        search: "",
                      })
                    }
                    className="chip mono text-xs uppercase tracking-[0.22em] text-white"
                  >
                    Reset All
                  </button>
                  <span className="chip mono text-xs uppercase tracking-[0.22em]">
                    Range {filters.dateRange}d
                  </span>
                  <span className="chip mono text-xs uppercase tracking-[0.22em]">
                    Severity {filters.severities.length || "All"}
                  </span>
                  <span className="chip mono text-xs uppercase tracking-[0.22em]">
                    Workflows {filters.workflowIds.length || "All"}
                  </span>
                </div>
              ) : null}

              {activeFilterPanel === "date" ? (
                <div className="flex flex-wrap gap-2">
                  {[7, 14, 30, 90].map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() =>
                        setFilters((current) => ({
                          ...current,
                          dateRange: range as typeof current.dateRange,
                        }))
                      }
                      className={`chip mono text-xs uppercase tracking-[0.22em] ${
                        filters.dateRange === range ? "border-[#4484ff] text-white" : ""
                      }`}
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
                        setFilters((current) => ({
                          ...current,
                          severities: current.severities.includes(severity)
                            ? current.severities.filter((item) => item !== severity)
                            : [...current.severities, severity],
                        }))
                      }
                      className={`chip mono text-xs uppercase tracking-[0.22em] ${
                        filters.severities.includes(severity) ? "border-[#4484ff] text-white" : ""
                      }`}
                    >
                      {severity}
                    </button>
                  ))}
                </div>
              ) : null}

              {activeFilterPanel === "workflow" ? (
                <div className="flex flex-wrap gap-2">
                  {workflows.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No workflows loaded yet. Create one to filter by operational scope.
                    </p>
                  ) : (
                    workflows.map((workflow) => (
                      <button
                        key={workflow.id}
                        type="button"
                        onClick={() =>
                          setFilters((current) => ({
                            ...current,
                            workflowIds: current.workflowIds.includes(workflow.id)
                              ? current.workflowIds.filter((item) => item !== workflow.id)
                              : [...current.workflowIds, workflow.id],
                          }))
                        }
                        className={`chip mono text-xs uppercase tracking-[0.22em] ${
                          filters.workflowIds.includes(workflow.id)
                            ? "border-[#4484ff] text-white"
                            : ""
                        }`}
                      >
                        {workflow.name}
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          <main className="flex-1 overflow-y-auto p-4 md:p-6 xl:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
