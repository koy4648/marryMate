export type PaymentType = 'DEPOSIT' | 'INTERIM' | 'BALANCE' | 'EXTRA' | 'REFUND' | 'OTHER'
export type PaymentStatus = 'SCHEDULED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'REFUNDED'

export type Payment = {
  id: string | number
  title: string
  category: string
  type: PaymentType
  scheduledAmount: number
  actualAmount: number
  dueDate: string
  paidDate: string | null
  payer: string
  status: PaymentStatus
}

export function summarizePayments(payments: Payment[]) {
  return payments.reduce((summary, payment) => {
    if (payment.status === 'CANCELLED') return summary
    if (payment.status === 'REFUNDED' || payment.type === 'REFUND') {
      summary.paid -= payment.actualAmount
      return summary
    }

    const paidAmount = Math.min(payment.actualAmount, payment.scheduledAmount)
    summary.paid += paidAmount
    summary.remaining += Math.max(payment.scheduledAmount - paidAmount, 0)
    if (payment.status === 'PAID') summary.paidCount += 1
    else summary.pendingCount += 1
    return summary
  }, { paid: 0, remaining: 0, paidCount: 0, pendingCount: 0 })
}

export function getPaymentTiming(payment: Payment, today: string) {
  if (payment.status === 'PAID') return { label: '결제 완료', tone: 'done' }
  if (payment.status === 'CANCELLED') return { label: '취소', tone: 'muted' }

  const day = 86_400_000
  const dueAt = new Date(`${payment.dueDate}T00:00:00Z`).getTime()
  const todayAt = new Date(`${today}T00:00:00Z`).getTime()
  const days = Math.round((dueAt - todayAt) / day)

  if (days < 0) return { label: `${Math.abs(days)}일 지남`, tone: 'danger' }
  if (days === 0) return { label: '오늘 결제', tone: 'danger' }
  if (days <= 7) return { label: `D-${days}`, tone: 'warning' }
  return { label: `D-${days}`, tone: 'neutral' }
}

export function formatWon(amount: number) {
  return `${Math.round(amount).toLocaleString('ko-KR')}원`
}

