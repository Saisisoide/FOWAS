"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DashboardFilters, Workflow } from "@/types";

const defaultFilters: DashboardFilters = {
  dateRange: 30,
  severities: [],
  workflowIds: [],
  riskLevels: [],
  tag: null,
  search: "",
};

interface GlobalFiltersContextValue {
  filters: DashboardFilters;
  setFilters: React.Dispatch<React.SetStateAction<DashboardFilters>>;
  workflows: Workflow[];
  setWorkflows: React.Dispatch<React.SetStateAction<Workflow[]>>;
}

const GlobalFiltersContext = createContext<GlobalFiltersContextValue | null>(null);

export function GlobalFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  const value = useMemo(
    () => ({ filters, setFilters, workflows, setWorkflows }),
    [filters, workflows],
  );

  return (
    <GlobalFiltersContext.Provider value={value}>
      {children}
    </GlobalFiltersContext.Provider>
  );
}

export function useGlobalFilters() {
  const context = useContext(GlobalFiltersContext);

  if (!context) {
    throw new Error("useGlobalFilters must be used within GlobalFiltersProvider");
  }

  return context;
}
