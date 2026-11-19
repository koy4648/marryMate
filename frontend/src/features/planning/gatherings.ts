import type { PlanningItem } from './planning'

export type GatheringSide = 'BRIDE' | 'GROOM' | 'BOTH'
export type GatheringAttendee = { name: string; side: GatheringSide }
export const gatheringSideLabel: Record<GatheringSide, string> = { BRIDE: '신부 측', GROOM: '신랑 측', BOTH: '공통 지인' }
export function isGathering(item: Pick<PlanningItem, 'serviceGroup' | 'itemName'>) {
  return item.serviceGroup === '청모' || (item.serviceGroup === '식사' && !item.itemName.startsWith('상견례'))
}
export function gatheringPeople(item: Pick<PlanningItem, 'attendees' | 'expectedAttendees'>) {
  const attendees = item.attendees ?? []
  return { total: Math.max(item.expectedAttendees ?? 0, attendees.length), named: attendees.length,
    bride: attendees.filter(person => person.side === 'BRIDE').length,
    groom: attendees.filter(person => person.side === 'GROOM').length,
    both: attendees.filter(person => person.side === 'BOTH').length }
}
