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

describe('shared calendar dates', () => {
  it('uses one wedding event so editing or clearing the date leaves no duplicate', () => {
    expect(calendarEvents([], [], '2026-12-01')).toEqual([expect.objectContaining({ id: 'wedding', date: '2026-12-01', kind: 'wedding' })])
    expect(calendarEvents([], [], null)).toEqual([])
  })
  it('shows completed payments on their actual paid date', () => {
    const events = calendarEvents([], [{ id: 1, title: '잔금', category: '웨딩홀', type: 'BALANCE', scheduledAmount: 3200800, actualAmount: 3200800, dueDate: '2026-12-01', paidDate: '2026-11-18', payer: '공동', status: 'PAID' }])
    expect(events[0]).toMatchObject({ date: '2026-11-18', done: true })
    expect(events[0].detail).toContain('3,200,800원')
  })
})
