import { describe, expect, it } from 'vitest'
import { budgetEstimates, packageFor } from './estimates'
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
  it('keeps individual estimates when their package is skipped', () => {
    const entries = budgetEstimates([item(1, { packageContract: true, status: 'SKIPPED' }), item(2, { packageParentId: 1 })], [], [], true)
    expect(entries[0].item.id).toBe(2)
  })
  it('includes or excludes honeymoon estimates', () => {
    const honeymoon = item(1, { serviceGroup: '신혼여행', itemName: '항공권' })
    expect(budgetEstimates([honeymoon], [], [], false)).toEqual([])
    expect(budgetEstimates([honeymoon], [], [], true)).toHaveLength(1)
  })
})
