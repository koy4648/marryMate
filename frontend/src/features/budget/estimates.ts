import type { PlanningItem } from '../planning/planning'
import type { VenueReview } from '../../lib/api'
import type { Payment } from './budget'

export function itemQuote(item: PlanningItem, reviews: VenueReview[]) {
  const consultation = reviews.find(review => review.planningItemId === item.id && review.reviewType === 'CONSULTATION')
  return item.serviceGroup === '웨딩홀' && consultation
    ? consultation.mealPrice * consultation.minimumGuarantee + consultation.rentalFee : item.quotedAmount
}

export function packageFor(item: PlanningItem, items: PlanningItem[]) {
  return items.find(parent => parent.id === item.packageParentId && parent.packageContract && parent.status !== 'SKIPPED')
}

// Each comparison contributes once: the selected vendor, or the lowest provisional quote.
export function budgetEstimates(items: PlanningItem[], reviews: VenueReview[], payments: Payment[], includeHoneymoon: boolean) {
  const groups = new Map<string, PlanningItem[]>()
  items.filter(item => item.status !== 'SKIPPED' && !packageFor(item, items) && (includeHoneymoon || item.serviceGroup !== '신혼여행')).forEach(item => {
    const key = `${item.serviceGroup}|${item.itemName}`
    groups.set(key, [...groups.get(key) ?? [], item])
  })
  return [...groups.values()].flatMap(candidates => {
    const selected = candidates.find(item => ['CONTRACTED', 'DONE'].includes(item.status))
    const item = selected ?? candidates.filter(item => itemQuote(item, reviews) > 0).sort((a, b) => itemQuote(a, reviews) - itemQuote(b, reviews))[0]
    if (!item) return []
    const linked = payments.filter(payment => payment.planningItemId === item.id && payment.status !== 'CANCELLED')
    const committed = linked.reduce((sum, payment) => sum + (payment.type === 'REFUND' ? -payment.actualAmount : payment.scheduledAmount), 0)
    const quote = itemQuote(item, reviews)
    return [{ item, quote, confirmed: !!selected, linked, planned: Math.max(quote, committed, item.actualAmount), actual: item.actualAmount }]
  })
}
