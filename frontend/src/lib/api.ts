import type { Payment, PaymentType } from '../features/budget/budget'
import type { GatheringAttendee } from '../features/planning/gatherings'
import type { PlanningItem } from '../features/planning/planning'

const API = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export type Session = { token: string; user: { id: number; email: string; nickname: string }; workspaceId: number | null }
export type Workspace = { id: number; name: string; role: 'OWNER' | 'MEMBER'; weddingDate: string | null; homeTitle: string; homeMessage: string }
export type Budget = { targetAmount: number; payments: Payment[]; includeHoneymoon: boolean; includeGifts: boolean; giftAmount: number }
export type GatheringInput = { name: string; place: string; scheduleDate: string | null; scheduleTime: string | null; expectedAttendees: number; attendees: GatheringAttendee[]; status: PlanningItem['status']; amount: number; memo: string }
export type PlanningItemInput = Omit<PlanningItem, 'id'>
export type VenueReview = { id:number; planningItemId:number; reviewType:'SECRET_TOUR'|'CONSULTATION'|'GUEST_TOUR'; visitedDate:string|null; content:string; pros:string; cons:string; mealPrice:number; minimumGuarantee:number; rentalFee:number; serviceItems:string; sameDayBenefits:string }
export type VenueReviewInput = Omit<VenueReview,'id'>

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
  navigation: (session: Session) => request<string[]>('/api/v1/preferences/navigation', {}, session),
  saveNavigation: (session: Session, menus: string[]) => request<string[]>('/api/v1/preferences/navigation', { method: 'PUT', body: JSON.stringify({ menus }) }, session),
  saveGathering: (session: Session, input: GatheringInput, id?: number) => request<PlanningItem>(`/api/v1/gatherings${id === undefined ? '' : `/${id}`}`, { method: id === undefined ? 'POST' : 'PUT', body: JSON.stringify(input) }, session),
  signup: (email: string, password: string, nickname: string) => request<Session>('/api/v1/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, nickname }) }),
  login: (email: string, password: string) => request<Session>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  changePassword: (session: Session, currentPassword: string, newPassword: string) => request<Session>('/api/v1/auth/me/password', {method:'PATCH',body:JSON.stringify({currentPassword,newPassword})},session),
  logout: (session: Session) => request<void>('/api/v1/auth/logout', {method:'POST'},session),
  leaveWorkspace: (session: Session) => request<Workspace[]>(`/api/v1/workspaces/${session.workspaceId}/members/me`, {method:'DELETE'},session),
  updateProfile: (session: Session, nickname: string) => request<Session['user']>('/api/v1/auth/me', { method: 'PATCH', body: JSON.stringify({ nickname }) }, session),
  workspaces: (session: Session) => request<Workspace[]>('/api/v1/workspaces', {}, session),
  renameWorkspace: (session: Session, workspaceId: number, name: string, weddingDate: string | null, homeTitle: string, homeMessage: string) => request<Workspace>(`/api/v1/workspaces/${workspaceId}`, { method: 'PATCH', body: JSON.stringify({ name, weddingDate, homeTitle, homeMessage }) }, session),
  createWorkspace: (session: Session, name: string, weddingDate: string | null) => request<Workspace>('/api/v1/workspaces', { method: 'POST', body: JSON.stringify({ name, weddingDate }) }, session),
  invite: (session: Session) => request<{ inviteCode: string }> (`/api/v1/workspaces/${session.workspaceId}/invites`, { method: 'POST' }, session),
  join: (session: Session, inviteCode: string) => request<Workspace>('/api/v1/workspaces/join', { method: 'POST', body: JSON.stringify({ inviteCode }) }, session),
  budget: (session: Session) => request<Budget>('/api/v1/budget', {}, session),
  target: (session: Session, targetAmount: number) => request<Budget>('/api/v1/budget', { method: 'PUT', body: JSON.stringify({ targetAmount }) }, session),
  preferences: (session: Session, body: { includeHoneymoon: boolean; includeGifts: boolean; giftAmount: number }) => request<Budget>('/api/v1/budget/preferences', { method: 'PUT', body: JSON.stringify(body) }, session),
  contract: (session: Session, id: number, stages: { type: PaymentType; amount: number; date: string | null; paid: boolean; paidDate: string | null; payer: string }[], revisedTotal?: number, venueTerms?: {mealPrice:number;guarantee:number;rentalFee:number}, giftEstimate?: {amount:number;deduct:boolean}) => request<Budget>(`/api/v1/budget/contracts/${id}`, { method: 'PUT', body: JSON.stringify({ stages, revisedTotal, venueTerms, giftEstimate }) }, session),
  addPayment: (session: Session, body: { category: string; title: string; type: PaymentType; scheduledAmount: number; dueDate: string; payer: string; memo: string }) => request<Payment>('/api/v1/budget/payments', { method: 'POST', body: JSON.stringify(body) }, session),
  completePayment: (session: Session, id: string | number, actualAmount: number, paidDate: string, payer: string) => request<Payment>(`/api/v1/budget/payments/${id}/complete`, { method: 'PATCH', body: JSON.stringify({ actualAmount, paidDate, payer }) }, session),
  planningItems: (session: Session) => request<PlanningItem[]>('/api/v1/planning-items', {}, session),
  addPlanningItem: (session: Session, body: PlanningItemInput) => request<PlanningItem>('/api/v1/planning-items', { method: 'POST', body: JSON.stringify(body) }, session),
  updatePlanningItem: (session: Session, id: number, body: PlanningItemInput) => request<PlanningItem>(`/api/v1/planning-items/${id}`, { method: 'PUT', body: JSON.stringify(body) }, session),
  selectPlanningItem: (session: Session, id: number) => request<PlanningItem[]>(`/api/v1/planning-items/${id}/select`, { method: 'POST' }, session),
  deletePlanningItem: (session: Session, id: number) => request<void>(`/api/v1/planning-items/${id}`, { method: 'DELETE' }, session),
  venueReviews: (session: Session) => request<VenueReview[]>('/api/v1/venue-reviews', {}, session),
  addVenueReview: (session: Session, body: VenueReviewInput) => request<VenueReview>('/api/v1/venue-reviews', { method: 'POST', body: JSON.stringify(body) }, session),
  updateVenueReview: (session: Session, id: number, body: VenueReviewInput) => request<VenueReview>(`/api/v1/venue-reviews/${id}`, { method: 'PUT', body: JSON.stringify(body) }, session),
  deleteVenueReview: (session: Session, id: number) => request<void>(`/api/v1/venue-reviews/${id}`, { method: 'DELETE' }, session),
}

