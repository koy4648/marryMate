import { type Payment, type PaymentGroupTotal } from './budget'
import { categoryPaymentTotals, packageFor } from './estimates'
import type { PlanningItem } from '../planning/planning'

export type ChartTotal = PaymentGroupTotal & { key: string; payments: Payment[]; grossScheduled?: number; giftDeduction?: number }

export function categoryChartTotals(payments: Payment[], items: PlanningItem[]): ChartTotal[] {
  return categoryPaymentTotals(payments, items).map(total => ({
    ...total,
    payments: payments.filter(payment => {
      if (payment.status === 'CANCELLED') return false
      const item = items.find(item => item.id === payment.planningItemId)
      const parent = item && (item.packageContract ? item : packageFor(item, items))
      return total.key === (parent ? `package:${parent.id}` : `category:${payment.category}`)
    }),
  }))
}

export function paidPayerTotals(payments: Payment[]): ChartTotal[] {
  const groups = new Map<string, ChartTotal>()
  for (const payment of payments) {
    if (payment.status === 'CANCELLED' || payment.actualAmount <= 0) continue
    const name = payment.payer || '미정'
    const group = groups.get(name) ?? { key: name, name, scheduled: 0, paid: 0, remaining: 0, count: 0, payments: [] }
    const refund = payment.type === 'REFUND' || payment.status === 'REFUNDED'
    group.paid += refund ? -payment.actualAmount : payment.actualAmount
    group.count += 1
    group.payments.push(payment)
    groups.set(name, group)
  }
  // Refunds reduce the amount actually contributed by each payer.
  return [...groups.values()].filter(group => group.paid !== 0).sort((a, b) => b.paid - a.paid || a.name.localeCompare(b.name, 'ko'))
}

// Keep the expense chart on the same estimate basis as the budget table,
// including quotations with no payment schedule and unlinked ledger expenses.
export function estimatedCategoryChartTotals(
  estimates: { item: PlanningItem; planned: number; linked: Payment[]; includedIds: number[] }[],
  payments: Payment[], items: PlanningItem[],
): ChartTotal[] {
  const groups = new Map<string, ChartTotal>()
  function add(key: string, name: string, amount: number, linked: Payment[]) {
    const active = linked.filter(payment => payment.status !== 'CANCELLED')
    const paid = active.reduce((sum, payment) => sum + (payment.type === 'REFUND' || payment.status === 'REFUNDED' ? -payment.actualAmount : Math.min(payment.actualAmount, payment.scheduledAmount)), 0)
    const current = groups.get(key) ?? { key, name, scheduled: 0, paid: 0, remaining: 0, count: 0, payments: [] }
    current.scheduled += amount
    current.paid += paid
    current.remaining += Math.max(0, amount - paid)
    current.count += active.length
    current.payments.push(...active)
    groups.set(key, current)
  }
  const linkedIds = new Set(estimates.flatMap(entry => [entry.item.id, ...entry.includedIds]))
  for (const entry of estimates) {
    const parent = entry.item.packageContract ? entry.item : undefined
    const key = parent ? `package:${parent.id}` : `category:${entry.item.serviceGroup}`
    const name = parent ? `${parent.itemName}${parent.vendorName ? ` · ${parent.vendorName}` : ''}` : entry.item.serviceGroup
    add(key, name, entry.planned, entry.linked)
  }
  const standalone = payments.filter(payment => !payment.planningItemId || !linkedIds.has(payment.planningItemId))
  for (const total of categoryChartTotals(standalone, items)) {
    const amount = total.payments.reduce((sum, payment) => sum + (payment.type === 'REFUND' || payment.status === 'REFUNDED' ? -payment.actualAmount : payment.scheduledAmount), 0)
    add(total.key, total.name, amount, total.payments)
  }
  return [...groups.values()].sort((a, b) => b.scheduled - a.scheduled || a.name.localeCompare(b.name, 'ko'))
}

export function categoryTotalsWithGifts(totals: ChartTotal[], giftAmount: number, includeGifts: boolean): ChartTotal[] {
  if (!includeGifts || giftAmount <= 0) return totals
  if (!totals.some(row => row.key === 'category:웨딩홀')) return [...totals, { key: 'gift-income', name: '축의금 수입', scheduled: -giftAmount, grossScheduled: 0, giftDeduction: giftAmount, paid: 0, remaining: 0, count: 0, payments: [] }]
  return totals.map(row => row.key !== 'category:웨딩홀' ? row : {
    ...row, grossScheduled: row.scheduled, giftDeduction: giftAmount, scheduled: row.scheduled - giftAmount,
  }).sort((a, b) => b.scheduled - a.scheduled || a.name.localeCompare(b.name, 'ko'))
}
