export type PaymentType = 'DEPOSIT' | 'INTERIM' | 'BALANCE' | 'EXTRA' | 'REFUND' | 'OTHER'
export type PaymentStatus = 'SCHEDULED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'REFUNDED'

export type Payment = {
  planningItemId?: number | null
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

export type PaymentGroupTotal = {
  name: string
  scheduled: number
  paid: number
  remaining: number
  count: number
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

export function groupPaymentTotals(payments: Payment[], key: (payment: Payment) => string) {
  const grouped = new Map<string, PaymentGroupTotal>()

  payments.forEach(payment => {
    if (payment.status === 'CANCELLED') return
    const name = key(payment) || '기타'
    const current = grouped.get(name) ?? { name, scheduled: 0, paid: 0, remaining: 0, count: 0 }
    if (payment.status === 'REFUNDED' || payment.type === 'REFUND') {
      current.paid -= payment.actualAmount
    } else {
      const paid = Math.min(payment.actualAmount, payment.scheduledAmount)
      current.scheduled += payment.scheduledAmount
      current.paid += paid
      current.remaining += Math.max(payment.scheduledAmount - paid, 0)
      current.count += 1
    }
    grouped.set(name, current)
  })

  return [...grouped.values()].sort((a, b) => b.scheduled - a.scheduled || a.name.localeCompare(b.name, 'ko'))
}

export function getPaymentTiming(payment: Payment, today: string) {
  if (payment.status === 'PAID') return { label: '납입 완료', tone: 'done' }
  if (payment.status === 'CANCELLED') return { label: '취소', tone: 'muted' }

  const day = 86_400_000
  const dueAt = new Date(`${payment.dueDate}T00:00:00Z`).getTime()
  const todayAt = new Date(`${today}T00:00:00Z`).getTime()
  const days = Math.round((dueAt - todayAt) / day)

  if (days < 0) return { label: `${Math.abs(days)}일 지남`, tone: 'danger' }
  if (days === 0) return { label: '오늘 납입', tone: 'danger' }
  if (days <= 7) return { label: `D-${days}`, tone: 'warning' }
  return { label: `D-${days}`, tone: 'neutral' }
}

export function formatWon(amount: number) {
  return `${Math.round(amount).toLocaleString('ko-KR')}원`
}


export function paymentAmountLabel({paid,remaining}:{paid:number;remaining:number}) {
  return [paid!==0?`납부 ${formatWon(paid)}`:'',remaining!==0?`남음 ${formatWon(remaining)}`:''].filter(Boolean).join(' · ')
}


export function parseWon(value: string) {
  const digits = value.replaceAll(',', '')
  if (!/^\d{1,15}$/.test(digits)) throw new Error('원 단위의 금액을 입력해 주세요.')
  return Number(digits)
}


export function filterCompletedPayments(payments:Payment[], showCompleted:boolean) {
  return payments.filter(payment=>payment.status!=='CANCELLED'&&!(payment.status==='PAID'&&payment.scheduledAmount===0&&payment.actualAmount===0)&&(showCompleted||payment.status!=='PAID'))
}
