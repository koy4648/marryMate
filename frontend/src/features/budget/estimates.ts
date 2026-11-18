import type { PlanningItem } from '../planning/planning'
import type { VenueReview } from '../../lib/api'
import { groupPaymentTotals, summarizePayments, type Payment } from './budget'

export function itemExtra(item: PlanningItem) {
  return item.extraAmount ?? (item.packageContract ? item.packageAdditionalAmount??0 : 0)
}

export function contractBaseAmount(item: PlanningItem) {
  return item.packageContract ? item.packageBaseAmount : item.contractAmountOverride ?? item.quotedAmount
}

export function itemQuote(item: PlanningItem, reviews: VenueReview[], items: PlanningItem[] = []) {
  const consultation = reviews.find(review => review.planningItemId === item.id && review.reviewType === 'CONSULTATION')
  const base = item.serviceGroup === '웨딩홀' && item.contractAmountOverride != null ? item.contractAmountOverride : item.serviceGroup === '웨딩홀' && consultation
    ? consultation.mealPrice * consultation.minimumGuarantee + consultation.rentalFee : item.quotedAmount
  const childExtras = item.packageContract ? items.filter(child=>child.packageParentId===item.id&&child.status!=='SKIPPED').reduce((sum,child)=>sum+itemExtra(child),0) : 0
  return base + (item.packageContract ? 0 : itemExtra(item)) + childExtras
}

export function packageFor(item: PlanningItem, items: PlanningItem[]) {
  return items.find(parent => parent.id === item.packageParentId && parent.packageContract && parent.status !== 'SKIPPED')
}

// Each comparison contributes once: the selected vendor, or the lowest provisional quote.
export function budgetEstimates(items: PlanningItem[], reviews: VenueReview[], payments: Payment[], includeHoneymoon: boolean, confirmedOnly = false) {
  const includedKeys = new Set(items.filter(item => packageFor(item, items)).map(item => `${item.serviceGroup}|${item.itemName}`))
  const groups = new Map<string, PlanningItem[]>()
  items.filter(item => (confirmedOnly ? item.status === 'CONTRACTED' : item.status !== 'SKIPPED') && !packageFor(item, items) && (item.packageContract || !includedKeys.has(`${item.serviceGroup}|${item.itemName}`) || ['CONTRACTED','DONE'].includes(item.status)) && (includeHoneymoon || item.serviceGroup !== '신혼여행')).forEach(item => {
    const key = confirmedOnly || item.packageContract || (item.serviceGroup === '신혼여행' && item.itemName === '숙소') ? `package-${item.id}` : `${item.serviceGroup}|${item.itemName}`
    groups.set(key, [...groups.get(key) ?? [], item])
  })
  return [...groups.values()].flatMap(candidates => {
    const selected = candidates.find(item => ['CONTRACTED', 'DONE'].includes(item.status))
    const item = selected ?? candidates.filter(item => itemQuote(item, reviews, items) > 0).sort((a, b) => itemQuote(a, reviews, items) - itemQuote(b, reviews, items))[0]
    if (!item) return []
    const includedIds = item.packageContract ? items.filter(child=>child.packageParentId===item.id&&child.status!=='SKIPPED').map(child=>child.id) : []
    const linked = payments.filter(payment => (payment.planningItemId === item.id || (payment.type==='EXTRA' && includedIds.includes(Number(payment.planningItemId)))) && payment.status !== 'CANCELLED')
    const committed = linked.reduce((sum, payment) => sum + (payment.type === 'REFUND' ? -payment.actualAmount : payment.scheduledAmount), 0)
    const quote = itemQuote(item, reviews, items)
    return [{ item, quote, confirmed: !!selected, linked, includedIds, planned: Math.max(quote, committed, item.actualAmount), actual: item.actualAmount }]
  })
}


export function isEstimateSettled(entry:{planned:number;linked:Payment[]}) {
  const summary=summarizePayments(entry.linked)
  return entry.linked.some(payment=>payment.status==='PAID') && summary.remaining===0 && summary.pendingCount===0 && summary.paid>=entry.planned
}

// Unlinked ledger entries are manually recorded expenses; linked entries follow their contract.
export function contractPayments(items: PlanningItem[], payments: Payment[]) {
  return payments.filter(payment => {
    if (payment.planningItemId == null) return true
    const item = items.find(item => item.id === payment.planningItemId)
    if (!item) return false
    const contract = packageFor(item, items) ?? item
    return contract.status === 'CONTRACTED'
  })
}

// Resolve saved payments through their package link, including older generic categories.
export function categoryPaymentTotals(payments: Payment[], items: PlanningItem[]) {
  const labels = new Map<string, string>()
  const totals = groupPaymentTotals(payments, payment => {
    const item = items.find(item => item.id === payment.planningItemId)
    const parent = item && (item.packageContract ? item : packageFor(item, items))
    const key = parent ? `package:${parent.id}` : `category:${payment.category}`
    labels.set(key, parent ? `${parent.itemName}${parent.vendorName ? ` · ${parent.vendorName}` : ''}` : payment.category)
    return key
  })
  return totals.map(total => ({...total, key: total.name, name: labels.get(total.name) ?? total.name}))
}
