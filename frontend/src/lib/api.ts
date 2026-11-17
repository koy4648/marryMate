import type { Payment, PaymentType } from '../features/budget/budget'
import type { PlanningItem } from '../features/planning/planning'

const API = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export type Session = { token: string; user: { id: number; email: string; nickname: string }; workspaceId: number | null }
export type Workspace = { id: number; name: string; role: 'OWNER' | 'MEMBER' }
export type Budget = { targetAmount: number; payments: Payment[] }
export type PlanningItemInput = Omit<PlanningItem, 'id'>

async function request<T>(path: string, init: RequestInit = {}, session?: Session): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(session?.workspaceId ? { 'X-Workspace-Id': String(session.workspaceId) } : {}),
      ...init.headers,
    },
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail ?? error.message ?? '요청을 처리하지 못했어요.')
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  signup: (email: string, password: string, nickname: string) => request<Session>('/api/v1/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, nickname }) }),
  login: (email: string, password: string) => request<Session>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  workspaces: (session: Session) => request<Workspace[]>('/api/v1/workspaces', {}, session),
  invite: (session: Session) => request<{ inviteCode: string }> (`/api/v1/workspaces/${session.workspaceId}/invites`, { method: 'POST' }, session),
  join: (session: Session, inviteCode: string) => request<Workspace>('/api/v1/workspaces/join', { method: 'POST', body: JSON.stringify({ inviteCode }) }, session),
  budget: (session: Session) => request<Budget>('/api/v1/budget', {}, session),
  target: (session: Session, targetAmount: number) => request<Budget>('/api/v1/budget', { method: 'PUT', body: JSON.stringify({ targetAmount }) }, session),
  addPayment: (session: Session, body: { category: string; title: string; type: PaymentType; scheduledAmount: number; dueDate: string; payer: string; memo: string }) => request<Payment>('/api/v1/budget/payments', { method: 'POST', body: JSON.stringify(body) }, session),
  completePayment: (session: Session, id: string | number, actualAmount: number, paidDate: string) => request<Payment>(`/api/v1/budget/payments/${id}/complete`, { method: 'PATCH', body: JSON.stringify({ actualAmount, paidDate }) }, session),
  planningItems: (session: Session) => request<PlanningItem[]>('/api/v1/planning-items', {}, session),
  addPlanningItem: (session: Session, body: PlanningItemInput) => request<PlanningItem>('/api/v1/planning-items', { method: 'POST', body: JSON.stringify(body) }, session),
  updatePlanningItem: (session: Session, id: number, body: PlanningItemInput) => request<PlanningItem>(`/api/v1/planning-items/${id}`, { method: 'PUT', body: JSON.stringify(body) }, session),
  deletePlanningItem: (session: Session, id: number) => request<void>(`/api/v1/planning-items/${id}`, { method: 'DELETE' }, session),
}

