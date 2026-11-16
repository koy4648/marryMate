import { useMemo, useState } from 'react'
import { formatWon, getPaymentTiming, summarizePayments, type Payment } from './features/budget/budget'
import './App.css'

const initialPayments: Payment[] = [
  { id: 'venue-deposit', title: '라움 웨딩홀 계약금', category: '웨딩홀', type: 'DEPOSIT', scheduledAmount: 3_000_000, actualAmount: 3_000_000, dueDate: '2026-11-05', paidDate: '2026-11-05', payer: '공동', status: 'PAID' },
  { id: 'studio-interim', title: '스튜디오 1차 중도금', category: '스튜디오', type: 'INTERIM', scheduledAmount: 1_200_000, actualAmount: 0, dueDate: '2026-11-20', paidDate: null, payer: '신부', status: 'SCHEDULED' },
  { id: 'snap-balance', title: '본식 스냅 잔금', category: '본식 촬영', type: 'BALANCE', scheduledAmount: 900_000, actualAmount: 0, dueDate: '2026-12-18', paidDate: null, payer: '신랑', status: 'SCHEDULED' },
]

const stages = [
  { icon: '⌂', name: '웨딩홀', count: '2곳 비교 중', progress: 72 },
  { icon: '◫', name: '본식 촬영', count: '3곳 비교 중', progress: 48 },
  { icon: '✦', name: '스튜디오', count: '상담 완료', progress: 64 },
  { icon: '♢', name: '드레스', count: '시작 전', progress: 8 },
]

const paymentTypeLabel: Record<Payment['type'], string> = {
  DEPOSIT: '계약금', INTERIM: '중도금', BALANCE: '잔금', EXTRA: '추가금', REFUND: '환불', OTHER: '기타',
}

function App() {
  const [payments, setPayments] = useState(initialPayments)
  const summary = useMemo(() => summarizePayments(payments), [payments])
  const totalBudget = 50_000_000
  const contracted = 38_400_000

  function togglePaid(id: string) {
    setPayments((current) => current.map((payment) => {
      if (payment.id !== id) return payment
      const paid = payment.status === 'PAID'
      return { ...payment, actualAmount: paid ? 0 : payment.scheduledAmount, paidDate: paid ? null : new Date().toISOString().slice(0, 10), status: paid ? 'SCHEDULED' : 'PAID' }
    }))
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Marry Mate 홈"><span className="brand-mark">m</span><span><strong>marry mate</strong><small>우리의 결혼 준비 공간</small></span></a>
        <nav aria-label="주요 기능"><a className="active" href="#dashboard">대시보드</a><a href="#preparations">준비</a><a href="#budget">예산</a><a href="#schedule">일정</a></nav>
        <button className="couple-button">윤서 · 메이트 <span>⌄</span></button>
      </header>

      <main id="top">
        <section className="hero" id="dashboard">
          <div><p className="eyebrow">D-278 · 2027년 8월 21일</p><h1>오늘도 우리답게,<br /><em>한 걸음 가까이.</em></h1><p className="hero-copy">결정해야 할 것과 다가오는 결제를 한눈에 확인해요.</p></div>
          <div className="hero-progress" aria-label="전체 준비 진행률 36퍼센트"><span>전체 준비</span><strong>36<small>%</small></strong><div><i style={{ width: '36%' }} /></div><p>9개 영역 중 2개 결정 완료</p></div>
        </section>

        <section className="metric-grid" id="budget" aria-label="예산 요약">
          <article><span>우리의 목표 예산</span><strong>{formatWon(totalBudget)}</strong><small>항목별로 나누어 관리해요</small></article>
          <article><span>현재 계약 금액</span><strong>{formatWon(contracted)}</strong><small className="positive">목표보다 {formatWon(totalBudget - contracted)} 여유</small></article>
          <article><span>결제 완료</span><strong>{formatWon(summary.paid)}</strong><small>{summary.paidCount}건 결제 완료</small></article>
          <article className="accent-card"><span>앞으로 결제할 금액</span><strong>{formatWon(summary.remaining)}</strong><small>{summary.pendingCount}건의 예정 결제</small></article>
        </section>

        <div className="content-grid">
          <section className="panel" id="schedule">
            <div className="section-heading"><div><p className="eyebrow">UPCOMING PAYMENTS</p><h2>계약금부터 잔금까지</h2></div><button className="text-button">＋ 결제 추가</button></div>
            <div className="payment-list">
              {payments.map((payment) => {
                const timing = getPaymentTiming(payment, '2026-11-16')
                return <article className={`payment-row ${payment.status === 'PAID' ? 'is-paid' : ''}`} key={payment.id}>
                  <div className={`payment-type type-${payment.type.toLowerCase()}`}>{paymentTypeLabel[payment.type]}</div>
                  <div className="payment-main"><strong>{payment.title}</strong><span>{payment.dueDate.replaceAll('-', '.')} · {payment.payer}</span></div>
                  <div className="payment-amount"><strong>{formatWon(payment.scheduledAmount)}</strong><span className={timing.tone}>{timing.label}</span></div>
                  <button className="status-button" onClick={() => togglePaid(payment.id)}>{payment.status === 'PAID' ? '완료 ✓' : '결제 완료'}</button>
                </article>
              })}
            </div>
          </section>

          <aside className="decision-card"><p className="eyebrow">NEXT DECISION</p><span className="decision-icon">◫</span><h2>본식 스냅,<br />이제 결정해 볼까요?</h2><p>후보 3곳의 견적과 상담 기록이 준비됐어요.</p><button>후보 비교하기 <span>→</span></button></aside>
        </div>

        <section className="preparations" id="preparations">
          <div className="section-heading"><div><p className="eyebrow">OUR PREPARATION</p><h2>하나씩, 우리답게 준비해요</h2></div><button className="text-button">전체 준비 보기 →</button></div>
          <div className="stage-grid">{stages.map((stage) => <article key={stage.name}><div><span className="stage-icon">{stage.icon}</span><small>{stage.progress}%</small></div><h3>{stage.name}</h3><p>{stage.count}</p><div className="stage-track"><i style={{ width: `${stage.progress}%` }} /></div></article>)}</div>
        </section>
      </main>

      <footer><strong>marry mate</strong><span>둘의 선택이 하나의 계획이 되는 곳</span></footer>
    </div>
  )
}

export default App

