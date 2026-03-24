const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

async function req(path: string, options: RequestInit = {}) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; full_name: string }) =>
    req('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    req('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => req('/auth/me'),

  // Organisations
  getOrgs: () => req('/organisations'),
  createOrg: (data: { name: string }) =>
    req('/organisations', { method: 'POST', body: JSON.stringify(data) }),
  inviteMember: (orgId: string, data: { email: string; role: string }) =>
    req(`/organisations/${orgId}/invite`, { method: 'POST', body: JSON.stringify(data) }),

  // Workflows
  getWorkflows: () => req('/workflows'),
  createWorkflow: (data: object) =>
    req('/workflows', { method: 'POST', body: JSON.stringify(data) }),
  updateWorkflow: (id: string, data: object) =>
    req(`/workflows/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Incidents
  getIncidents: () => req('/incidents'),
  getIncident: (id: string) => req(`/incidents/${id}`),
  createIncident: (data: object) =>
    req('/incidents', { method: 'POST', body: JSON.stringify(data) }),
  updateIncident: (id: string, data: object) =>
    req(`/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteIncident: (id: string) =>
    req(`/incidents/${id}`, { method: 'DELETE' }),

  // Analytics
  getSummary: () => req('/analytics/summary'),
  getTrend: () => req('/analytics/trend'),
  getSeverity: () => req('/analytics/severity'),
  getRiskDist: () => req('/analytics/risk-distribution'),
  getWorkflowRisk: () => req('/analytics/workflow-risk'),
}