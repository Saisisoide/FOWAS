"use client";

import type {
  AnalyticsSummary,
  AuthTokenResponse,
  Incident,
  IncidentCreateInput,
  IncidentUpdateInput,
  Organisation,
  OrganisationCreateInput,
  User,
  Workflow,
  WorkflowCreateInput,
} from "@/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

const TOKEN_KEY = "fowas.access_token";

function buildHeaders(auth = true, hasBody = false) {
  const headers = new Headers();

  if (hasBody) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getStoredToken();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return headers;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  options?: { auth?: boolean; hasBody?: boolean },
) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: buildHeaders(options?.auth ?? true, options?.hasBody ?? false),
  });

  if (!response.ok) {
    let detail = "Request failed";

    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload.detail) {
        detail = payload.detail;
      }
    } catch {
      detail = response.statusText || detail;
    }

    throw new Error(detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function login(email: string, password: string) {
  return request<AuthTokenResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    { auth: false, hasBody: true },
  );
}

export async function register(
  fullName: string,
  email: string,
  password: string,
) {
  return request<User>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify({
        full_name: fullName,
        email,
        password,
      }),
    },
    { auth: false, hasBody: true },
  );
}

export async function getCurrentUser() {
  return request<User>("/auth/me");
}

export async function getIncidents() {
  // Backend now returns {items, total, skip, limit}. Unwrap for backward compat.
  const response = await request<{ items: Incident[]; total: number; skip: number; limit: number }>("/incidents?limit=500");
  return response.items;
}

export async function getIncidentsPaginated(params?: {
  severity?: string;
  status?: string;
  workflow_id?: string;
  main_category?: string;
  search?: string;
  tag?: string;
  date_from?: string;
  date_to?: string;
  skip?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    }
  }
  const qs = searchParams.toString();
  return request<{ items: Incident[]; total: number; skip: number; limit: number }>(
    `/incidents${qs ? `?${qs}` : ""}`,
  );
}

export async function getIncident(id: string) {
  return request<Incident>(`/incidents/${id}`);
}

export async function createIncident(input: IncidentCreateInput) {
  return request<Incident>(
    "/incidents",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    { hasBody: true },
  );
}

export async function updateIncident(incidentId: string, input: IncidentUpdateInput) {
  return request<Incident>(
    `/incidents/${incidentId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    { hasBody: true },
  );
}

export async function getWorkflows() {
  return request<Workflow[]>("/workflows");
}

export async function createWorkflow(input: WorkflowCreateInput) {
  return request<Workflow>(
    "/workflows",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    { hasBody: true },
  );
}

export async function getOrganisations() {
  return request<Organisation[]>("/organisations");
}

export async function createOrganisation(input: OrganisationCreateInput) {
  return request<Organisation>(
    "/organisations",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    { hasBody: true },
  );
}

export async function getAnalyticsSummary() {
  return request<AnalyticsSummary>("/analytics/summary");
}

// ------------------------------------------------------------------ //
//  Workflow management                                                //
// ------------------------------------------------------------------ //

export async function updateWorkflow(
  workflowId: string,
  input: { name?: string; description?: string; visibility?: string },
) {
  return request<Workflow>(
    `/workflows/${workflowId}`,
    { method: "PATCH", body: JSON.stringify(input) },
    { hasBody: true },
  );
}

export async function deleteWorkflow(workflowId: string) {
  return request<{ detail: string }>(
    `/workflows/${workflowId}`,
    { method: "DELETE" },
  );
}

// ------------------------------------------------------------------ //
//  Incident delete                                                    //
// ------------------------------------------------------------------ //

export async function deleteIncident(incidentId: string) {
  return request<{ detail: string }>(
    `/incidents/${incidentId}`,
    { method: "DELETE" },
  );
}

// ------------------------------------------------------------------ //
//  Organisation member management                                     //
// ------------------------------------------------------------------ //

export interface OrgMember {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  joined_at: string;
}

export async function getOrgMembers(orgId: string) {
  return request<OrgMember[]>(`/organisations/${orgId}/members`);
}

export async function inviteOrgMember(orgId: string, email: string, role: string = "MEMBER") {
  return request<{ detail: string }>(
    `/organisations/${orgId}/invite`,
    { method: "POST", body: JSON.stringify({ email, role }) },
    { hasBody: true },
  );
}

export async function updateMemberRole(orgId: string, userId: string, role: string) {
  return request<{ detail: string }>(
    `/organisations/${orgId}/members/${userId}`,
    { method: "PATCH", body: JSON.stringify({ role }) },
    { hasBody: true },
  );
}

export async function removeMember(orgId: string, userId: string) {
  return request<{ detail: string }>(
    `/organisations/${orgId}/members/${userId}`,
    { method: "DELETE" },
  );
}

export async function deleteOrganisation(orgId: string) {
  return request<{ detail: string }>(
    `/organisations/${orgId}`,
    { method: "DELETE" },
  );
}
