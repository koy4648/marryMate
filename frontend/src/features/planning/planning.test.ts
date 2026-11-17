import { describe, expect, it } from 'vitest'
import { calendarEvents, monthCells, planningProgress, type PlanningItem } from './planning'

const item = (status: PlanningItem['status'], scheduleDate: string | null = null): PlanningItem => ({
  id: Math.random(), serviceGroup: '본식', itemName: '드레스', vendorName: '', status, scheduleDate,
  quotedAmount: 0, actualAmount: 0, packageContract: false, packageBaseAmount: 0, packageAdditionalAmount: 0,
  packageIncludedItems: '', packageAdditionalDetails: '', rating: null, reviewType: 'NONE', review: '', pros: '', cons: '', memo: '',
})

describe('planning helpers', () => {
  it('calculates progress without skipped items', () => {
    expect(planningProgress([item('DONE'), item('CONTRACTED'), item('TODO'), item('SKIPPED')])).toEqual({ completed: 2, total: 3, percent: 67 })
  })

  it('builds a six-week calendar starting on Sunday', () => {
    const cells = monthCells(2026, 10)
    expect(cells).toHaveLength(42)
    expect(cells[0].date).toBe('2026-11-01')
  })

  it('combines scheduled preparation with payment events', () => {
    const events = calendarEvents([item('SCHEDULED', '2026-11-20')], [{ id: 1, title: '잔금', category: '웨딩홀', type: 'BALANCE', scheduledAmount: 100, actualAmount: 0, dueDate: '2026-11-21', paidDate: null, payer: '공동', status: 'SCHEDULED' }])
    expect(events.map(event => event.kind)).toEqual(['planning', 'payment'])
  })
})
