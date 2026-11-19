import type { Budget, VenueReview } from '../../lib/api'
import type { PlanningItem } from '../planning/planning'
import { budgetEstimates, contractPayments, packageFor } from './estimates'
import { venueGiftEstimate } from './venue-cost'

export function isHoneymoonPayment(payment: Budget['payments'][number], items: PlanningItem[]) {
  const item = items.find(item => item.id === payment.planningItemId)
  const parent = item && packageFor(item, items)
  return payment.category === '신혼여행' || item?.serviceGroup === '신혼여행' || parent?.serviceGroup === '신혼여행'
}

export function budgetView(items: PlanningItem[], reviews: VenueReview[], budget: Budget) {
  const payerPayments = budget.payments.filter(payment => budget.includeHoneymoon || !isHoneymoonPayment(payment, items))
  const payments = contractPayments(items, budget.payments).filter(payment => budget.includeHoneymoon || !isHoneymoonPayment(payment, items))
  const estimates = budgetEstimates(items, reviews, budget.payments, budget.includeHoneymoon, true)
  // Include honeymoon estimates even before a payment schedule is recorded.
  const honeymoonEstimates = budget.includeHoneymoon
    ? budgetEstimates(items, reviews, budget.payments, true).filter(entry => entry.item.serviceGroup === '신혼여행' && !estimates.some(existing => existing.item.id === entry.item.id))
    : []
  const allEstimates = [...estimates, ...honeymoonEstimates]
  const linkedIds = new Set(allEstimates.flatMap(entry => [entry.item.id, ...entry.includedIds]))
  const standalone = payments.filter(payment => !payment.planningItemId || !linkedIds.has(payment.planningItemId))
  const projectedTotal = allEstimates.reduce((sum, entry) => sum + entry.planned, 0) + standalone.reduce((sum, payment) => sum + (payment.status === 'CANCELLED' ? 0 : payment.type === 'REFUND' || payment.status === 'REFUNDED' ? -payment.actualAmount : payment.scheduledAmount), 0)
  const venueGifts = allEstimates.filter(entry=>entry.item.serviceGroup==='웨딩홀').flatMap(entry=>{
    const item=entry.item
    const consultation=item.contractAmountOverride==null?reviews.find(review=>review.planningItemId===item.id&&review.reviewType==='CONSULTATION'):undefined
    const mealPrice=item.venueMealPrice??consultation?.mealPrice
    const guarantee=item.venueGuarantee??consultation?.minimumGuarantee
    return mealPrice==null||guarantee==null?[]:[{itemId:item.id,amount:venueGiftEstimate(mealPrice,guarantee)}]
  })
  const giftIsAutomatic=venueGifts.length>0
  const giftAmount=giftIsAutomatic?venueGifts.reduce((sum,entry)=>sum+entry.amount,0):budget.giftAmount
  const netTotal = projectedTotal - (budget.includeGifts ? giftAmount : 0)
  return { payments, payerPayments, estimates: allEstimates, projectedTotal, netTotal, giftAmount, giftIsAutomatic, venueGifts }
}
