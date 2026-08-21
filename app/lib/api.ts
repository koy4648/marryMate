import type {
  AuthSession, CreateVenuePlanRequest, CreateVenueVisitRequest,
  VenuePlanResponse, VenueVisit, Workspace,
} from "./types";

const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

function baseUrl() {
  if (configuredBaseUrl) return configuredBaseUrl;
  if (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname)) return "http://localhost:8080";
  return "";
}

async function request<T>(path: string, init?: RequestInit, session?: AuthSession): Promise<T> {
  const api = baseUrl();
  if (!api) throw new Error("API_NOT_CONFIGURED");
  const response = await fetch(`${api}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(session?.workspaceId ? { "X-Workspace-Id": String(session.workspaceId) } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "요청을 처리하지 못했어요." }));
    throw new Error(error.message ?? `API_${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const authApi = {
  signup: (email: string, password: string, nickname: string) => request<AuthSession>("/api/v1/auth/signup", { method: "POST", body: JSON.stringify({ email, password, nickname }) }),
  login: (email: string, password: string) => request<AuthSession>("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
};

export const workspaceApi = {
  list: (session: AuthSession) => request<Workspace[]>("/api/v1/workspaces", undefined, session),
  createInvite: (session: AuthSession) => request<{ inviteCode: string; expiresAt: string }>(`/api/v1/workspaces/${session.workspaceId}/invites`, { method: "POST" }, session),
  join: (session: AuthSession, inviteCode: string) => request<Workspace>("/api/v1/workspaces/join", { method: "POST", body: JSON.stringify({ inviteCode }) }, session),
};

export const venueApi = {
  listPlans: (session: AuthSession) => request<VenuePlanResponse[]>("/api/v1/venue-plans", undefined, session),
  createPlan: (session: AuthSession, body: CreateVenuePlanRequest) => request<VenuePlanResponse>("/api/v1/venue-plans", { method: "POST", body: JSON.stringify(body) }, session),
  getPlan: (session: AuthSession, planId: string | number) => request<VenuePlanResponse>(`/api/v1/venue-plans/${planId}`, undefined, session),
  listVisits: (session: AuthSession, planId: string | number) => request<VenueVisit[]>(`/api/v1/venue-plans/${planId}/visits`, undefined, session),
  createVisit: (session: AuthSession, planId: string | number, body: CreateVenueVisitRequest) => request<VenueVisit>(`/api/v1/venue-plans/${planId}/visits`, { method: "POST", body: JSON.stringify(body) }, session),
  updateVisit: (session: AuthSession, planId: string | number, visitId: string | number, body: CreateVenueVisitRequest) => request<VenueVisit>(`/api/v1/venue-plans/${planId}/visits/${visitId}`, { method: "PUT", body: JSON.stringify(body) }, session),
};
