import { describe, expect, it } from 'vitest'
import { contractSchedule } from './contract-schedule'
import { budgetEstimates } from './estimates'
import { filterCompletedPayments, type Payment } from './budget'
import type { PlanningItem } from '../planning/planning'
const item: PlanningItem = {
  id: 1, serviceGroup: '패키지', itemName: '웨딩 패키지', vendorName: '업체', status: 'CONTRACTED', scheduleDate: null,
  quotedAmount: 1000000, actualAmount: 0, packageContract: true, packageBaseAmount: 1000000, packageAdditionalAmount: 0,
  packageIncludedItems: '', packageAdditionalDetails: '', rating: null, reviewType: 'NONE', review: '', pros: '', cons: '', memo: '',
}
const balance: Payment = {
  id: 1, planningItemId: 1, title: '잔금', category: '패키지', type: 'BALANCE', scheduledAmount: 1000000, actualAmount: 0,
  dueDate: '2027-01-01', paidDate: null, payer: '신부', status: 'SCHEDULED',
}
describe('saved contract schedule', () => {
  it('reopens balance-only schedules with zero for omitted stages and no invented dates', () => {
    const result = contractSchedule(item, [balance], '2026-11-18')
    expect(result.hasSavedSchedule).toBe(true)
    expect(result.stages.map(stage => stage.amount)).toEqual([0, 0, 1000000])
    expect(result.stages.map(stage => stage.date)).toEqual(['', '', '2027-01-01'])
    expect(result.stages.map(stage => stage.paidDate)).toEqual(['', '', ''])
    expect(result.stages[2].payer).toBe('신부')
    expect(result.stages.reduce((sum, stage) => sum + stage.amount, 0)).toBe(item.packageBaseAmount)
  })
  it('keeps exact amounts, payers and paid dates, including explicit zero payments', () => {
    const deposit = {...balance, id: 2, type: 'DEPOSIT' as const, scheduledAmount: 123456, actualAmount: 123456, status: 'PAID' as const, paidDate: '2026-11-01', payer: '신랑'}
    const interim = {...balance, id: 3, type: 'INTERIM' as const, scheduledAmount: 0, actualAmount: 0, status: 'PAID' as const}
    const result = contractSchedule(item, [deposit, interim, {...balance, scheduledAmount: 876544}], '2026-11-18')
    expect(result.stages.map(stage => stage.amount)).toEqual([123456, 0, 876544])
    expect(result.stages[0]).toMatchObject({status: 'PAID', paidDate: '2026-11-01', payer: '신랑'})
    expect(result.stages[1].status).toBe('PAID')
  })
  it('only suggests amounts on first entry and ignores extras and other contracts', () => {
    const result = contractSchedule(item, [{...balance, type: 'EXTRA'}, {...balance, planningItemId: 2}], '2026-11-18')
    expect(result.hasSavedSchedule).toBe(false)
    expect(result.stages.map(stage => stage.amount)).toEqual([100000, 400000, 500000])
  })
  it('hides zero paid rows and zero DONE items while retaining zero CONTRACTED items', () => {
    expect(filterCompletedPayments([{...balance, scheduledAmount: 0, actualAmount: 0, status: 'PAID'}], true)).toEqual([])
    const contracted = {...item, quotedAmount: 0, packageBaseAmount: 0}
    expect(budgetEstimates([contracted, {...contracted, id: 2, status: 'DONE'}], [], [], true, true).map(entry => entry.item.id)).toEqual([1])
  })
})
