import type { Payment, PaymentType } from './budget'
import { contractBaseAmount } from './estimates'
import type { PlanningItem } from '../planning/planning'

const stages = [['DEPOSIT', '계약금'], ['INTERIM', '중도금'], ['BALANCE', '잔금']] as const

export function contractSchedule(item: PlanningItem, payments: Payment[], today: string) {
  const saved = payments.filter(payment => payment.planningItemId === item.id && payment.status !== 'CANCELLED' && stages.some(([type]) => type === payment.type))
  const hasSavedSchedule = saved.length > 0
  const total = contractBaseAmount(item)
  const deposit = Math.round(total * .1 / 10000) * 10000
  const interim = Math.round(total * .4 / 10000) * 10000
  const suggested = [deposit, interim, Math.max(total - deposit - interim, 0)]
  return {
    hasSavedSchedule,
    stages: stages.map(([type, label], index) => {
      const existing = saved.find(payment => payment.type === type)
      return {
        type: type as PaymentType, label,
        amount: existing?.scheduledAmount ?? (hasSavedSchedule ? 0 : suggested[index]),
        date: existing?.dueDate ?? (!hasSavedSchedule && index === 0 ? today : ''),
        status: existing?.status === 'PAID' ? 'PAID' : 'SCHEDULED',
        paidDate: existing?.paidDate ?? (hasSavedSchedule ? '' : today),
        payer: existing?.payer ?? '공동',
      }
    }),
  }
}
