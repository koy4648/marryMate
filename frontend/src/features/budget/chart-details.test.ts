import { describe, expect, it } from 'vitest'
import { categoryChartTotals, paidPayerTotals, categoryTotalsWithGifts } from './chart-details'
import type { Payment } from './budget'
const payment = (id: number, changes: Partial<Payment> = {}): Payment => ({ id, title: '웨딩홀 계약금', category: '웨딩홀', type: 'DEPOSIT', scheduledAmount: 1000000, actualAmount: 0, dueDate: '2026-12-01', paidDate: null, payer: '신랑', status: 'SCHEDULED', ...changes })
describe('actual payer chart', () => {
  it('omits scheduled payers and counts only actual money, including partial payments', () => {
    const rows = [payment(1, { status: 'PAID', actualAmount: 1000000 }), payment(2, { status: 'PARTIALLY_PAID', actualAmount: 250000, payer: '신부' }), payment(3, { payer: '부모님' }), payment(4, { status: 'CANCELLED', actualAmount: 1000000 })]
    const totals = paidPayerTotals(rows)
    expect(totals.map(row => [row.name, row.paid, row.count])).toEqual([['신랑', 1000000, 1], ['신부', 250000, 1]])
    expect(totals.flatMap(row => row.payments).map(row => row.id)).toEqual([1, 2])
  })
  it('moves an actual payment to the recorded payer and subtracts refunds', () => {
    const rows = [payment(1, { status: 'PAID', actualAmount: 1000000, payer: '신부' }), payment(2, { status: 'REFUNDED', type: 'REFUND', actualAmount: 100000, payer: '신부' }), payment(3)]
    const totals = paidPayerTotals(rows)
    expect(totals).toHaveLength(1)
    expect(totals[0]).toMatchObject({ name: '신부', paid: 900000, count: 2 })
    expect(totals[0].payments).toEqual(rows.slice(0, 2))
  })
  it('retains the entire actual amount even when more than the scheduled amount was paid', () => {
    expect(paidPayerTotals([payment(1, { actualAmount: 1100000, status: 'PAID' })])[0].paid).toBe(1100000)
  })
})
describe('category itemization', () => {
  it('ties each displayed total to its included payments and excludes cancelled rows', () => {
    const rows = [payment(1), payment(2, { category: '신혼여행' }), payment(3, { status: 'CANCELLED' })]
    const totals = categoryChartTotals(rows, [])
    expect(totals.find(row => row.key === 'category:웨딩홀')?.payments).toEqual([rows[0]])
    expect(totals.find(row => row.key === 'category:신혼여행')?.payments).toEqual([rows[1]])
    for (const total of totals) expect(total.payments.reduce((sum, row) => sum + row.scheduledAmount, 0)).toBe(total.scheduled)
  })
})

describe('gift income in category bars', () => {
  it('deducts gifts from venue costs once and preserves payment history', () => {
    const totals = categoryChartTotals([payment(1), payment(2, { category: '신혼여행', scheduledAmount: 500000 })], [])
    const included = categoryTotalsWithGifts(totals, 700000, true)
    expect(included.find(row => row.name === '웨딩홀')).toMatchObject({ scheduled: 300000, grossScheduled: 1000000, giftDeduction: 700000 })
    expect(included.reduce((sum, row) => sum + row.scheduled, 0)).toBe(800000)
    expect(included.find(row => row.name === '웨딩홀')?.payments).toEqual(totals.find(row => row.name === '웨딩홀')?.payments)
    expect(categoryTotalsWithGifts(totals, 700000, false)).toEqual(totals)
    expect(totals.find(row => row.name === '웨딩홀')?.scheduled).toBe(1000000)
  })
  it('retains gift surplus and shows income when no venue exists', () => {
    const totals = categoryChartTotals([payment(1)], [])
    expect(categoryTotalsWithGifts(totals, 1500000, true)[0].scheduled).toBe(-500000)
    expect(categoryTotalsWithGifts([], 1500000, true)[0]).toMatchObject({ name: '축의금 수입', scheduled: -1500000 })
    expect(categoryTotalsWithGifts(totals, 0, true)).toEqual(totals)
  })
})
