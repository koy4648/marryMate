import type { CreateVenuePlanRequest, CreateVenueVisitRequest, VenuePlanResponse, VenueVisit } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) throw new Error("API_NOT_CONFIGURED");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) throw new Error(`API_${response.status}`);
  return response.json() as Promise<T>;
}

export const venueApi = {
  isConfigured: Boolean(API_BASE_URL),
  listPlans: () => request<VenuePlanResponse[]>("/api/v1/venue-plans"),
  createPlan: (body: CreateVenuePlanRequest) =>
    request<VenuePlanResponse>("/api/v1/venue-plans", { method: "POST", body: JSON.stringify(body) }),
  getPlan: (planId: string | number) =>
    request<VenuePlanResponse>(`/api/v1/venue-plans/${planId}`),
  createVisit: (planId: string | number, body: CreateVenueVisitRequest) =>
    request<VenueVisit>(`/api/v1/venue-plans/${planId}/visits`, { method: "POST", body: JSON.stringify(body) }),
};
