import type { CreateVenueRequest, CreateVenueVisitRequest } from "./types";

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
  createVenue: (body: CreateVenueRequest) =>
    request<{ id: number }>("/api/v1/venues", { method: "POST", body: JSON.stringify(body) }),
  createVisit: (venueId: string | number, body: CreateVenueVisitRequest) =>
    request<{ id: number }>(`/api/v1/venues/${venueId}/visits`, { method: "POST", body: JSON.stringify(body) }),
};
