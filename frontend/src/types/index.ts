export interface User {
  id: string
  email: string
  full_name: string
  created_at: string
}

export interface Organisation {
  id: string
  name: string
  created_by: string
  created_at: string
}

export interface Workflow {
  id: string
  name: string
  description?: string
  organisation_id?: string
  created_by: string
  visibility: 'PRIVATE' | 'ORGANISATION' | 'PUBLIC'
  created_at: string
}

export interface Incident {
  id: string
  workflow_id: string
  title: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  impact: number
  engineer?: string
  main_category: string
  sub_category: string
  notes?: string
  linked_to?: string
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED'
  visibility: 'PRIVATE' | 'ORGANISATION' | 'PUBLIC'
  created_by: string
  assigned_to?: string
  created_at: string
  resolved_at?: string
  tags: { id: string; name: string }[]
  risk_score?: number
  risk_level?: 'LOW' | 'MODERATE' | 'HIGH'
}

export interface AnalyticsSummary {
  total_incidents: number
  open_incidents: number
  high_risk_count: number
  resolved_count: number
  mttr_hours?: number
  mtbf_hours?: number
  availability_ratio?: number
}