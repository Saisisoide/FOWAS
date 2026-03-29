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
  return request<Incident[]>("/incidents");
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
