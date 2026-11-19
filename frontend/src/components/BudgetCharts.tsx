import { useEffect, useId, useRef, useState, type SyntheticEvent } from 'react'
import { createPortal } from 'react-dom'
import { formatWon, paymentAmountLabel, type Payment } from '../features/budget/budget'
import { BudgetImpact, type BudgetImpactValue } from './BudgetImpact'
import { categoryTotalsWithGifts, type ChartTotal } from '../features/budget/chart-details'

const chartColors = ['#4a5136', '#7b8062', '#a5a78d', '#c2b89d', '#8a725b', '#666959']
type Detail = { item: ChartTotal; total: number; paidOnly: boolean; left: number; top: number; maxHeight: number }

function donutPath(start: number, share: number) {
  const point = (radius: number, percent: number) => {
    const angle = percent / 100 * Math.PI * 2 - Math.PI / 2
    return `${83 + radius * Math.cos(angle)},${83 + radius * Math.sin(angle)}`
  }
  const middle = start + share / 2
  const end = start + share
  return `M${point(83, start)} A83,83 0 0 1 ${point(83, middle)} A83,83 0 0 1 ${point(83, end)} L${point(50, end)} A50,50 0 0 0 ${point(50, middle)} A50,50 0 0 0 ${point(50, start)} Z`
}

function actualAmount(payment: Payment) {
  return payment.type === 'REFUND' || payment.status === 'REFUNDED' ? -payment.actualAmount : payment.actualAmount
}

export function BudgetCharts({ categories, payers, impact }: { categories: ChartTotal[]; payers: ChartTotal[]; impact?: BudgetImpactValue }) {
  const [detail, setDetail] = useState<Detail | null>(null)
  const [sources, setSources] = useState({ categories, payers, includeGifts: impact?.includeGifts, giftAmount: impact?.giftAmount })
  if (sources.categories !== categories || sources.payers !== payers || sources.includeGifts !== impact?.includeGifts || sources.giftAmount !== impact?.giftAmount) {
    setSources({ categories, payers, includeGifts: impact?.includeGifts, giftAmount: impact?.giftAmount })
    setDetail(null)
  }
  const tooltipId = useId()
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  categories = categoryTotalsWithGifts(categories, impact?.giftAmount ?? 0, impact?.includeGifts ?? false)
  const categoryTotal = categories.reduce((sum, item) => sum + item.scheduled, 0)
  const payerTotal = payers.reduce((sum, item) => sum + Math.max(0, item.paid), 0)
  const maxCategoryAmount = Math.max(...categories.map(item => Math.abs(item.scheduled)), 1)
  function cancelHide() { if (hideTimer.current) clearTimeout(hideTimer.current) }
  function hideSoon() { cancelHide(); hideTimer.current = setTimeout(() => setDetail(null), 180) }

  useEffect(() => {
    const dismiss = () => setDetail(null)
    const scroll = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('.chart-tooltip')) return
      dismiss()
    }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') dismiss() }
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest('.chart-tooltip, .chart-detail-target, .donut-segment')) return
      dismiss()
    }
    window.addEventListener('scroll', scroll, true)
    window.addEventListener('resize', dismiss)
    window.addEventListener('keydown', escape)
    window.addEventListener('pointerdown', outside)
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
      window.removeEventListener('scroll', scroll, true)
      window.removeEventListener('resize', dismiss)
      window.removeEventListener('keydown', escape)
      window.removeEventListener('pointerdown', outside)
    }
  }, [])

  function interactions(item: ChartTotal, total: number, paidOnly = false) {
    function show(event: SyntheticEvent<Element>) {
      cancelHide()
      const rect = event.currentTarget.getBoundingClientRect()
      const width = Math.min(340, window.innerWidth - 24)
      const left = Math.max(12, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 12))
      const below = window.innerHeight - rect.bottom - 20
      const above = rect.top - 20
      const height = Math.min(440, Math.max(below, above), window.innerHeight - 24)
      const top = below >= Math.min(440, above) ? Math.max(12, rect.bottom + 8) : Math.max(12, rect.top - height - 8)
      setDetail({ item, total, paidOnly, left, top, maxHeight: Math.max(120, height) })
    }
    return {
      tabIndex: 0,
      'aria-label': `${item.name}, ${paidOnly ? '실제 납부' : '예상 부담액'} ${formatWon(paidOnly ? item.paid : item.scheduled)}, 결제 ${item.count}건`,
      'aria-describedby': detail?.item === item ? tooltipId : undefined,
      onPointerEnter: show, onPointerLeave: hideSoon, onFocus: show, onBlur: hideSoon, onClick: show,
    }
  }

  return <section className="budget-insights">
    <article className="panel category-chart">
      <div className="section-heading"><div><p className="eyebrow">CATEGORY</p><h2>어디에 얼마나 쓰고 있을까</h2><p>{impact?.includeGifts ? '예상 부담액 기준이에요. 축의금은 웨딩홀 비용에서 차감해요. 웨딩홀 항목이 없으면 수입으로 표시해요.' : '예상 총비용 기준이에요. 축의금 수입은 제외했어요.'}</p></div><span className="chart-key"><i/>결제 완료 <i/>남은 금액</span></div>
      {categories.length === 0 ? <p className="empty">견적이나 결제를 추가하면 카테고리별 그래프가 생겨요.</p> : <>
        <p className="chart-hint">막대에 마우스를 올리거나 눌러 포함된 결제 명세를 확인하세요.</p>
        <div className="bar-chart">{categories.map(item => <div className="bar-row chart-detail-target" key={item.key} {...interactions(item, categoryTotal)}>
          <div><strong>{item.name}</strong><small>{paymentAmountLabel(item)}</small>{item.giftDeduction != null && <small>총비용 {formatWon(item.grossScheduled ?? 0)} − 축의금 {formatWon(item.giftDeduction)}</small>}</div>
          <div className={`bar-track ${item.scheduled < 0 ? 'income-bar' : ''}`} style={{ width: `${Math.max(Math.abs(item.scheduled) / maxCategoryAmount * 100, 8)}%` }}><i style={{ width: `${item.scheduled > 0 ? Math.max(0, Math.min(item.paid / item.scheduled * 100, 100)) : 0}%` }}/></div>
          <b>{formatWon(item.scheduled)}</b>
        </div>)}</div>
      </>}
      {impact && <BudgetImpact {...impact}/>}
    </article>
    <article className="panel payer-chart">
      <div className="section-heading"><div><p className="eyebrow">PAID BY</p><h2>누가 얼마나 냈을까</h2><p>실제 납부액 기준이에요. 신혼여행 포함 선택은 반영하고, 예상 축의금은 납부액에서 빼지 않아요.</p></div></div>
      {payers.length === 0 ? <p className="empty">실제 납부한 내역이 생기면 결제자별 금액을 볼 수 있어요.</p> : <>
        <p className="chart-hint">도넛 구간이나 결제자에 마우스를 올리거나 눌러 납부 명세를 확인하세요.</p>
        <div className="payer-visual">
          <div className="payer-donut">
            <svg viewBox="0 0 166 166" className="payer-donut-segments" aria-label="결제자별 실제 납부 금액 비중">
              <circle cx="83" cy="83" r="66.5" fill="none" stroke="#d7d5c9" strokeWidth="33"/>
              {payers.map((item, index) => {
                if (item.paid <= 0 || payerTotal <= 0) return null
                const start = payers.slice(0, index).reduce((sum, entry) => sum + Math.max(0, entry.paid), 0) / payerTotal * 100
                return <path key={item.key} className="donut-segment" d={donutPath(start, item.paid / payerTotal * 100)} fill={chartColors[index % chartColors.length]} {...interactions(item, payerTotal, true)}/>
              })}
            </svg>
            <span><strong>{payers.filter(item => item.paid > 0).length}</strong>명·그룹</span>
          </div>
          <div className="payer-legend">{payers.map((item, index) => <div className="chart-detail-target" key={item.key} {...interactions(item, payerTotal, true)}>
            <i style={{ background: chartColors[index % chartColors.length] }}/><span>{item.name}<small>{item.count}건 · 실제 납부</small></span><strong>{formatWon(item.paid)}</strong>
          </div>)}</div>
        </div>
      </>}
    </article>
    {detail && createPortal(<div id={tooltipId} role="tooltip" tabIndex={0} className="chart-tooltip" style={{ left: detail.left, top: detail.top, maxHeight: detail.maxHeight }} onPointerEnter={cancelHide} onPointerLeave={hideSoon} onFocus={cancelHide} onBlur={hideSoon}>
      <strong>{detail.item.name}</strong>
      <small>{detail.item.payments.length}건 · {detail.paidOnly ? '실제 납부 기준 · 환불 차감' : '현재 축의금 설정 반영'}</small>
      <dl>
        {detail.paidOnly ? <div><dt>실제 납부 합계</dt><dd>{formatWon(detail.item.paid)}</dd></div> : <>
          <div><dt>예상 총비용</dt><dd>{formatWon(detail.item.grossScheduled ?? detail.item.scheduled)}</dd></div>
          {detail.item.giftDeduction != null && <><div><dt>축의금 차감</dt><dd>−{formatWon(detail.item.giftDeduction)}</dd></div><div><dt>예상 부담액</dt><dd>{formatWon(detail.item.scheduled)}</dd></div></>}
          <div><dt>납부 금액</dt><dd>{formatWon(detail.item.paid)}</dd></div>
          <div><dt>남은 금액</dt><dd>{formatWon(detail.item.remaining)}</dd></div>
        </>}
        <div><dt>전체 대비 비중</dt><dd>{detail.total > 0 ? (Math.max(0, detail.paidOnly ? detail.item.paid : detail.item.scheduled) / detail.total * 100).toLocaleString('ko-KR', { maximumFractionDigits: 1 }) : '0'}%</dd></div>
      </dl>
      <h3>포함된 결제 명세</h3>
      {detail.item.payments.length===0&&<p className="chart-hint">견적 금액을 반영했어요. 결제 일정은 아직 등록하지 않았어요.</p>}
      <ul className="chart-payment-details">{detail.item.payments.map(payment => <li key={payment.id}>
        <div><strong>{payment.title}</strong><b>{formatWon(detail.paidOnly ? actualAmount(payment) : payment.scheduledAmount)}</b></div>
        <small>{payment.category} · {payment.payer || '미정'} · {(detail.paidOnly ? payment.paidDate ?? payment.dueDate : payment.dueDate).replaceAll('-', '.')}</small>
        {!detail.paidOnly && <small>{payment.type === 'REFUND' || payment.status === 'REFUNDED' ? `환불 ${formatWon(payment.actualAmount)}` : `납부 ${formatWon(payment.actualAmount)} · 남음 ${formatWon(Math.max(0, payment.scheduledAmount - payment.actualAmount))}`}</small>}
      </li>)}</ul>
    </div>, document.body)}
  </section>
}
