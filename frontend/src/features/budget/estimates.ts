import type { PlanningItem } from '../planning/planning'
import type { VenueReview } from '../../lib/api'
import type { Payment } from './budget'

export function itemExtra(item: PlanningItem) {
  return item.extraAmount ?? (item.packageContract ? item.packageAdditionalAmount??0 : 0)
}

export function contractBaseAmount(item: PlanningItem) {
  return item.packageContract ? item.packageBaseAmount : item.quotedAmount
}

export function itemQuote(item: PlanningItem, reviews: VenueReview[], items: PlanningItem[] = []) {
  const consultation = reviews.find(review => review.planningItemId === item.id && review.reviewType === 'CONSULTATION')
  const base = item.serviceGroup === '웨딩홀' && consultation
    ? consultation.mealPrice * consultation.minimumGuarantee + consultation.rentalFee : item.quotedAmount
  const childExtras = item.packageContract ? items.filter(child=>child.packageParentId===item.id&&child.status!=='SKIPPED').reduce((sum,child)=>sum+itemExtra(child),0) : 0
  return base + (item.packageContract ? 0 : itemExtra(item)) + childExtras
}

export function packageFor(item: PlanningItem, items: PlanningItem[]) {
  return items.find(parent => parent.id === item.packageParentId && parent.packageContract && parent.status !== 'SKIPPED')
}

// Each comparison contributes once: the selected vendor, or the lowest provisional quote.
export function budgetEstimates(items: PlanningItem[], reviews: VenueReview[], payments: Payment[], includeHoneymoon: boolean) {
  const includedKeys = new Set(items.filter(item => packageFor(item, items)).map(item => `${item.serviceGroup}|${item.itemName}`))
  const groups = new Map<string, PlanningItem[]>()
  items.filter(item => item.status !== 'SKIPPED' && !packageFor(item, items) && (item.packageContract || !includedKeys.has(`${item.serviceGroup}|${item.itemName}`) || ['CONTRACTED','DONE'].includes(item.status)) && (includeHoneymoon || item.serviceGroup !== '신혼여행')).forEach(item => {
    const key = item.packageContract ? `package-${item.id}` : `${item.serviceGroup}|${item.itemName}`
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
