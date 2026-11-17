import { describe, expect, it } from 'vitest'
import { getPaymentTiming, groupPaymentTotals, summarizePayments, type Payment } from './budget'

const payments: Payment[] = [
  { id: '1', title: '계약금', category: '웨딩홀', type: 'DEPOSIT', scheduledAmount: 100, actualAmount: 100, dueDate: '2026-11-01', paidDate: '2026-11-01', payer: '공동', status: 'PAID' },
  { id: '2', title: '중도금', category: '웨딩홀', type: 'INTERIM', scheduledAmount: 200, actualAmount: 50, dueDate: '2026-11-20', paidDate: null, payer: '공동', status: 'PARTIALLY_PAID' },
  { id: '3', title: '잔금', category: '웨딩홀', type: 'BALANCE', scheduledAmount: 300, actualAmount: 0, dueDate: '2026-12-20', paidDate: null, payer: '공동', status: 'SCHEDULED' },
]

describe('payment budget', () => {
  it('separates paid and remaining amounts', () => {
    expect(summarizePayments(payments)).toEqual({ paid: 150, remaining: 450, paidCount: 1, pendingCount: 2 })
  })

  it('marks payments due within seven days', () => {
    expect(getPaymentTiming(payments[1], '2026-11-16')).toEqual({ label: 'D-4', tone: 'warning' })
  })

  it('groups scheduled, paid, and remaining money for charts', () => {
    expect(groupPaymentTotals(payments, payment => payment.category)).toEqual([
      { name: '웨딩홀', scheduled: 600, paid: 150, remaining: 450, count: 3 },
    ])
    expect(groupPaymentTotals(payments, payment => payment.payer)).toEqual([
      { name: '공동', scheduled: 600, paid: 150, remaining: 450, count: 3 },
    ])
  })

  it('marks overdue payments', () => {
    expect(getPaymentTiming({ ...payments[2], dueDate: '2026-11-10' }, '2026-11-16')).toEqual({ label: '6일 지남', tone: 'danger' })
  })
})

