import type { Payment } from '../budget/budget'

export type PlanningStatus = 'TODO' | 'RESEARCHING' | 'SCHEDULED' | 'CONTRACTED' | 'DONE' | 'SKIPPED'
export type ReviewType = 'NONE' | 'SECRET_TOUR' | 'CONSULTATION' | 'GUEST_TOUR' | 'GENERAL'

export type PlanningItem = {
  id: number
  serviceGroup: string
  itemName: string
  vendorName: string
  status: PlanningStatus
  scheduleDate: string | null
  quotedAmount: number
  actualAmount: number
  packageContract: boolean
  packageBaseAmount: number
  packageAdditionalAmount: number
  packageIncludedItems: string
  packageAdditionalDetails: string
  rating: number | null
  reviewType: ReviewType
  review: string
  pros: string
  cons: string
  memo: string
}

export type CalendarEvent = {
  id: string
  date: string
  title: string
  detail: string
  kind: 'planning' | 'payment'
  done: boolean
}

export const statusLabel: Record<PlanningStatus, string> = {
  TODO: '할 일', RESEARCHING: '알아보는 중', SCHEDULED: '일정 확정', CONTRACTED: '계약 완료', DONE: '완료', SKIPPED: '건너뜀',
}

export const reviewTypeLabel: Record<ReviewType, string> = {
  NONE: '후기 없음', SECRET_TOUR: '암행투어', CONSULTATION: '실제 상담', GUEST_TOUR: '하객 투어', GENERAL: '일반 후기',
}

export function planningProgress(items: PlanningItem[]) {
  const active = items.filter(item => item.status !== 'SKIPPED')
  const completed = active.filter(item => item.status === 'DONE' || item.status === 'CONTRACTED').length
  return { completed, total: active.length, percent: active.length ? Math.round(completed / active.length * 100) : 0 }
}

export function calendarEvents(items: PlanningItem[], payments: Payment[]): CalendarEvent[] {
  const plans = items.filter(item => item.scheduleDate).map(item => ({
    id: `plan-${item.id}`, date: item.scheduleDate!, title: item.vendorName || item.itemName,
    detail: `${item.serviceGroup} · ${item.itemName}`, kind: 'planning' as const, done: item.status === 'DONE',
  }))
  const due = payments.map(payment => ({
    id: `payment-${payment.id}`, date: payment.dueDate, title: payment.title,
    detail: `${payment.category} · ${payment.scheduledAmount.toLocaleString('ko-KR')}원`, kind: 'payment' as const, done: payment.status === 'PAID',
  }))
  return [...plans, ...due].sort((a, b) => a.date.localeCompare(b.date))
}

export function monthCells(year: number, month: number) {
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - first.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    return { date: value, day: date.getDate(), currentMonth: date.getMonth() === month }
  })
}
