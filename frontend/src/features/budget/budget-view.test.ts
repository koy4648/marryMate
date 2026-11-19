import { describe, expect, it } from 'vitest'
import { budgetView } from './budget-view'
import { estimatedCategoryChartTotals, paidPayerTotals } from './chart-details'
import type { Budget } from '../../lib/api'
import type { PlanningItem } from '../planning/planning'
import type { Payment } from './budget'
const item = (id: number, changes: Partial<PlanningItem> = {}): PlanningItem => ({ id, serviceGroup: '웨딩홀', itemName: '계약', vendorName: '업체', status: 'CONTRACTED', scheduleDate: null, quotedAmount: 10000000, actualAmount: 0, packageContract: false, packageBaseAmount: 0, packageAdditionalAmount: 0, packageIncludedItems: '', packageAdditionalDetails: '', rating: null, reviewType: 'NONE', review: '', pros: '', cons: '', memo: '', ...changes })
const payment = (id: number, changes: Partial<Payment> = {}): Payment => ({ id, title: '계약금', category: '웨딩홀', type: 'DEPOSIT', scheduledAmount: 1000000, actualAmount: 1000000, dueDate: '2026-12-01', paidDate: '2026-11-19', payer: '신랑', status: 'PAID', ...changes })
const budget: Budget = { targetAmount: 20000000, includeHoneymoon: true, includeGifts: false, giftAmount: 3000000, payments: [] }
describe('budget criteria', () => {
  it('uses a confirmed manual venue total while retaining automatic gift income',()=>{
    const venue=item(1,{venueMealPrice:83600,venueGuarantee:200,venueRentalFee:8500000,quotedAmount:24000000,contractAmountOverride:24000000})
    const view=budgetView([venue],[],{...budget,includeGifts:true})
    expect(view.projectedTotal).toBe(24000000)
    expect(view.giftAmount).toBe(16720000)
    expect(view.netTotal).toBe(7280000)
    expect(estimatedCategoryChartTotals(view.estimates,view.payments,[venue])[0].scheduled).toBe(24000000)
  })
  it('automatically uses guaranteed meals as gift income in the table and charts',()=>{
    const venue=item(1,{venueMealPrice:83600,venueGuarantee:200,venueRentalFee:8500000,contractAmountOverride:25220000,quotedAmount:25220000})
    const included=budgetView([venue],[],{...budget,giftAmount:0,includeGifts:true})
    expect(included.giftIsAutomatic).toBe(true)
    expect(included.venueGifts).toEqual([{itemId:1,amount:16720000}])
    expect(included.giftAmount).toBe(16720000)
    expect(included.netTotal).toBe(8500000)
    const chart=estimatedCategoryChartTotals(included.estimates,included.payments,[venue])
    expect(chart.reduce((sum,row)=>sum+row.scheduled,0)-included.giftAmount).toBe(included.netTotal)
    const excluded=budgetView([venue],[],{...budget,includeGifts:false})
    expect(excluded.giftAmount).toBe(16720000)
    expect(excluded.netTotal).toBe(25220000)
    const changed={...venue,venueMealPrice:84000,quotedAmount:25300000,contractAmountOverride:25300000}
    expect(budgetView([changed],[],{...budget,includeGifts:true}).giftAmount).toBe(16800000)
  })
  it('includes honeymoon estimates without schedules and saved accommodation bookings once', () => {
    const items = [item(1), item(2, { serviceGroup: '신혼여행', itemName: '항공권', quotedAmount: 2000000, status: 'RESEARCHING' }), item(3, { serviceGroup: '신혼여행', itemName: '숙소', quotedAmount: 500000 }), item(4, { serviceGroup: '신혼여행', itemName: '숙소', quotedAmount: 700000 })]
    expect(budgetView(items, [], budget).projectedTotal).toBe(13200000)
    expect(budgetView(items, [], { ...budget, includeHoneymoon: false }).projectedTotal).toBe(10000000)
    expect(budgetView(items, [], budget).estimates).toHaveLength(4)
  })
  it('filters honeymoon payments using linked categories and avoids double-counting schedules', () => {
    const items = [item(1), item(2, { serviceGroup: '신혼여행', quotedAmount: 2000000 })]
    const payments = [payment(1, { planningItemId: 1 }), payment(2, { planningItemId: 2, category: '기타', scheduledAmount: 2000000 }), payment(3, { planningItemId: null, category: '신혼여행', scheduledAmount: 300000 })]
    const included = budgetView(items, [], { ...budget, payments })
    const excluded = budgetView(items, [], { ...budget, payments, includeHoneymoon: false })
    expect(included.projectedTotal).toBe(12300000)
    expect(excluded.projectedTotal).toBe(10000000)
    expect(excluded.payments.map(row => row.id)).toEqual([1])
    expect(payments).toHaveLength(3)
  })
  it('retains actual payer history after a preparation item is marked done', () => {
    const rows=[payment(1,{planningItemId:1})]
    const view=budgetView([item(1,{status:'DONE'})],[],{...budget,payments:rows})
    expect(paidPayerTotals(view.payerPayments)[0].paid).toBe(1000000)
  })
  it('keeps table and chart on the same totals for all honeymoon and gift selections',()=>{
    const items=[item(1),item(2,{serviceGroup:'신혼여행',itemName:'항공권',quotedAmount:2000000,status:'RESEARCHING'})]
    const rows=[payment(1,{planningItemId:1}),payment(2,{planningItemId:null,category:'기타',scheduledAmount:100000,actualAmount:0,status:'SCHEDULED'})]
    for(const includeHoneymoon of [false,true]) for(const includeGifts of [false,true]) {
      const view=budgetView(items,[],{...budget,payments:rows,includeHoneymoon,includeGifts})
      const chart=estimatedCategoryChartTotals(view.estimates,view.payments,items)
      const chartTotal=chart.reduce((sum,row)=>sum+row.scheduled,0)
      expect(chartTotal).toBe(view.projectedTotal)
      expect(chartTotal-(includeGifts?budget.giftAmount:0)).toBe(view.netTotal)
      expect(chart.some(row=>row.name==='신혼여행')).toBe(includeHoneymoon)
      expect(paidPayerTotals(view.payerPayments).reduce((sum,row)=>sum+row.paid,0)).toBe(1000000)
    }
  })
  it('subtracts gifts once without changing actual payments or outstanding installments', () => {
    const payments = [payment(1, { planningItemId: 1 })]
    const without = budgetView([item(1)], [], { ...budget, payments })
    const withGifts = budgetView([item(1)], [], { ...budget, payments, includeGifts: true })
    expect(without.netTotal).toBe(10000000)
    expect(withGifts.netTotal).toBe(7000000)
    expect(withGifts.projectedTotal).toBe(without.projectedTotal)
    expect(withGifts.payments).toEqual(without.payments)
  })
})
