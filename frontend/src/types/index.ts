export type Severity = "LOW" | "MEDIUM" | "HIGH";
export type Status = "OPEN" | "INVESTIGATING" | "RESOLVED";
export type IncidentVisibility = "PRIVATE" | "ORGANISATION" | "PUBLIC";
export type Category =
  | "TECHNICAL"
  | "OPERATIONAL"
  | "HUMAN"
  | "EXTERNAL"
  | "SYSTEMIC";
export type WorkflowVisibility = "PRIVATE" | "ORGANISATION" | "PUBLIC";
export type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
export type RiskLevel = "LOW" | "MODERATE" | "HIGH";

export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type?: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  organisation_id: string | null;
  created_by: string;
  visibility: WorkflowVisibility;
  created_at: string;
}

export interface Organisation {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface Incident {
  id: string;
  workflow_id: string;
  title: string;
  severity: Severity;
  impact: number;
  engineer: string | null;
  main_category: Category;
  sub_category: string;
  notes: string | null;
  linked_to: string | null;
  status: Status;
  visibility: IncidentVisibility;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  resolved_at: string | null;
  tags: Tag[];
  risk_score: number | null;
  risk_level: RiskLevel | null;
}

export interface AnalyticsSummary {
  total_incidents: number;
  open_incidents: number;
  high_risk_count: number;
  resolved_count: number;
  mttr_hours: number | null;
  mtbf_hours: number | null;
  availability_ratio: number | null;
}

export interface IncidentCreateInput {
  workflow_id: string;
  title: string;
  severity: Severity;
  impact: number;
  engineer?: string;
  main_category: Category;
  sub_category: string;
  tags: string[];
  notes?: string;
  linked_to?: string;
  visibility: IncidentVisibility;
}

export interface WorkflowCreateInput {
  name: string;
  description?: string;
  organisation_id?: string;
  visibility: WorkflowVisibility;
}

export interface OrganisationCreateInput {
  name: string;
}

export interface DashboardFilters {
  dateRange: 7 | 14 | 30 | 90;
  severities: Severity[];
  workflowIds: string[];
  riskLevels: RiskLevel[];
  tag: string | null;
  search: string;
}

export interface IncidentUpdateInput {
  title?: string;
  severity?: Severity;
  impact?: number;
  status?: Status;
  engineer?: string;
  notes?: string;
  visibility?: IncidentVisibility;
  assigned_to?: string;
}
