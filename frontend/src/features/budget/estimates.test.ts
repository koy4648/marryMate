import { describe, expect, it } from 'vitest'
import { budgetEstimates, packageFor, itemQuote, contractPayments, contractBaseAmount } from './estimates'
import { formatWon, parseWon, type Payment } from './budget'
import type { PlanningItem } from '../planning/planning'
const item = (id: number, change: Partial<PlanningItem> = {}): PlanningItem => ({
  id, serviceGroup: '스튜디오', itemName: '드레스', vendorName: `업체 ${id}`, status: 'RESEARCHING', scheduleDate: null,
  quotedAmount: 3200800, actualAmount: 0, packageContract: false, packageBaseAmount: 0, packageAdditionalAmount: 0,
  packageIncludedItems: '', packageAdditionalDetails: '', rating: null, reviewType: 'NONE', review: '', pros: '', cons: '', memo: '', ...change,
})
const payment: Payment = { id: 1, planningItemId: 1, title: '계약금', category: '스튜디오', type: 'DEPOSIT', scheduledAmount: 320080, actualAmount: 320080, dueDate: '2026-11-20', paidDate: '2026-11-18', payer: '공동', status: 'PAID' }

describe('shared estimates', () => {
  it('accepts an exact won amount and displays comma grouping', () => {
    expect(parseWon('3,200,800')).toBe(3200800)
    expect(formatWon(parseWon('3200800'))).toBe('3,200,800원')
  })
  it('uses the lowest provisional candidate once, then the chosen vendor', () => {
    const candidates = [item(1), item(2, { quotedAmount: 2000000 })]
    expect(budgetEstimates(candidates, [], [], true).map(e => e.quote)).toEqual([2000000])
    candidates[0].status = 'CONTRACTED'
    expect(budgetEstimates(candidates, [], [], true).map(e => e.quote)).toEqual([3200800])
  })
  it('counts a package once and keeps its payment schedule linked', () => {
    const parent = item(1, { itemName: '패키지', packageContract: true, status: 'CONTRACTED' })
    const child = item(2, { packageParentId: 1 })
    expect(packageFor(child, [parent, child])).toBe(parent)
    const estimates = budgetEstimates([parent, child], [], [payment], true)
    expect(estimates).toHaveLength(1)
    expect(estimates[0].planned).toBe(3200800)
    expect(estimates[0].linked).toEqual([payment])
  })
  it('does not add provisional alternatives for an item already included in a package', () => {
    const parent=item(1,{serviceGroup:'패키지',packageContract:true,status:'CONTRACTED'})
    const child=item(2,{packageParentId:1})
    const alternative=item(3,{quotedAmount:1000000})
    expect(budgetEstimates([parent,child,alternative],[],[],true).map(entry=>entry.item.id)).toEqual([1])
    alternative.status='CONTRACTED'
    expect(budgetEstimates([parent,child,alternative],[],[],true).map(entry=>entry.item.id)).toEqual([1,3])
  })
  it('keeps individual estimates when their package is skipped' , () => {
    const entries = budgetEstimates([item(1, { packageContract: true, status: 'SKIPPED' }), item(2, { packageParentId: 1 })], [], [], true)
    expect(entries[0].item.id).toBe(2)
  })
  it('counts two packages with the same category and item name independently, excluding every inclusion', () => {
    const first=item(1,{serviceGroup:'패키지',itemName:'웨딩 패키지',packageContract:true,status:'CONTRACTED',quotedAmount:2430000})
    const second=item(2,{...first,id:2,vendorName:'더라운지',quotedAmount:1130000})
    const estimates=budgetEstimates([first,second,item(3,{packageParentId:1}),item(4,{packageParentId:2})],[],[payment],true)
    expect(estimates).toHaveLength(2)
    expect(estimates.reduce((sum,entry)=>sum+entry.planned,0)).toBe(3560000)
  })
  it('adds an ordinary extra to its base quote once', () => {
    const ordinary=item(1,{quotedAmount:1000000,extraAmount:12345})
    expect(itemQuote(ordinary,[])).toBe(1012345)
    expect(budgetEstimates([ordinary],[],[],true)[0].planned).toBe(1012345)
  })
  it('rolls included-item extras and their payments into the parent package once', () => {
    const parent=item(1,{packageContract:true,status:'CONTRACTED',quotedAmount:1020000,packageBaseAmount:1000000,packageAdditionalAmount:20000,extraAmount:20000})
    const child=item(2,{packageParentId:1,quotedAmount:0,extraAmount:50000})
    const extra={...payment,id:2,planningItemId:2,type:'EXTRA' as const,scheduledAmount:50000,actualAmount:0,status:'SCHEDULED' as const}
    const entries=budgetEstimates([parent,child],[],[payment,extra],true)
    expect(entries).toHaveLength(1)
    expect(entries[0].quote).toBe(1070000)
    expect(entries[0].planned).toBe(1070000)
    expect(entries[0].includedIds).toEqual([2])
    expect(entries[0].linked).toHaveLength(2)
  })
  it('includes or excludes honeymoon estimates' , () => {
    const honeymoon = item(1, { serviceGroup: '신혼여행', itemName: '항공권' })
    expect(budgetEstimates([honeymoon], [], [], false)).toEqual([])
    expect(budgetEstimates([honeymoon], [], [], true)).toHaveLength(1)
  })
})

describe('settled estimates',()=>{
  it('hides only fully funded contracts, retaining unpaid extras and partial payments',async()=>{
    const {isEstimateSettled}=await import('./estimates')
    const paid={...payment,scheduledAmount:1000,actualAmount:1000,status:'PAID' as const}
    expect(isEstimateSettled({planned:1000,linked:[paid]})).toBe(true)
    expect(isEstimateSettled({planned:1500,linked:[paid]})).toBe(false)
    expect(isEstimateSettled({planned:1000,linked:[{...paid,status:'PARTIALLY_PAID',actualAmount:500}]})).toBe(false)
    expect(isEstimateSettled({planned:0,linked:[]})).toBe(false)
  })
})

describe('contract-only budget', () => {
  it('shows every contracted vendor independently, including zero quotes and paid contracts', () => {
    const items = [item(1, {status:'CONTRACTED'}), item(2, {status:'CONTRACTED', quotedAmount:0}), item(3, {status:'DONE', vendorName:'트윈클링'}), item(4, {status:'RESEARCHING', vendorName:'더 화이트베일'})]
    const entries = budgetEstimates(items, [], [{...payment, scheduledAmount:3200800, actualAmount:3200800}], true, true)
    expect(entries.map(entry=>entry.item.id)).toEqual([1,2])
    expect(entries[0].linked).toHaveLength(1)
  })
  it('counts package inclusions once and keeps other contracted vendors of the same kind', () => {
    const items = [item(1, {status:'CONTRACTED', packageContract:true}), item(2, {status:'CONTRACTED', packageParentId:1}), item(3, {status:'CONTRACTED'})]
    expect(budgetEstimates(items, [], [], true, true).map(entry=>entry.item.id)).toEqual([1,3])
  })
  it('filters linked payments by contract status while retaining package extras and manual payments', () => {
    const items = [item(1, {status:'CONTRACTED', packageContract:true}), item(2, {packageParentId:1}), item(3, {status:'DONE'}), item(4)]
    const payments = [payment, {...payment,id:2,planningItemId:2,type:'EXTRA' as const}, {...payment,id:3,planningItemId:3}, {...payment,id:4,planningItemId:4}, {...payment,id:5,planningItemId:null}, {...payment,id:6,planningItemId:99}]
    expect(contractPayments(items,payments).map(payment=>payment.id)).toEqual([1,2,5])
    expect(budgetEstimates([item(1,{serviceGroup:'신혼여행',status:'CONTRACTED'})],[],[],false,true)).toEqual([])
  })
})

describe('revised contract totals', () => {
  it('uses the confirmed venue total instead of the original consultation estimate', () => {
    const venue=item(1,{serviceGroup:'웨딩홀',contractAmountOverride:3300800,quotedAmount:0,extraAmount:20000,status:'CONTRACTED'})
    const reviews=[{id:1,planningItemId:1,reviewType:'CONSULTATION' as const,visitedDate:null,content:'원래 상담',pros:'',cons:'',mealPrice:50000,minimumGuarantee:100,rentalFee:1000000,serviceItems:'',sameDayBenefits:''}]
    expect(contractBaseAmount(venue)).toBe(3300800)
    expect(itemQuote(venue,reviews)).toBe(3320800)
    expect(budgetEstimates([venue],reviews,[],true,true)[0].planned).toBe(3320800)
    expect(reviews[0].mealPrice).toBe(50000)
  })
  it('keeps additional package charges outside the installment total', () => {
    const parent=item(1,{packageContract:true,packageBaseAmount:3300800,packageAdditionalAmount:20000,quotedAmount:3320800})
    expect(contractBaseAmount(parent)).toBe(3300800)
    expect(itemQuote(parent,[])).toBe(3320800)
  })
})
