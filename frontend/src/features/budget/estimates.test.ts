import { describe, expect, it } from 'vitest'
import { budgetEstimates, packageFor, itemQuote } from './estimates'
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
