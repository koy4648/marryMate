import { useRef, useState } from 'react'
import type { Budget } from '../lib/api'
import { MoneyInput } from './MoneyInput'
import { IncludeExclude } from './IncludeExclude'
import { formatWon } from '../features/budget/budget'

export type BudgetOptions = Pick<Budget, 'includeHoneymoon' | 'includeGifts' | 'giftAmount'>

export function BudgetPreferences({ value, projectedTotal, netTotal, onSave, automaticGifts = false }: {
  automaticGifts?: boolean; value: BudgetOptions; projectedTotal: number; netTotal: number; onSave: (value: BudgetOptions) => Promise<void>
}) {
  const [draft, setDraft] = useState<{ saved: number; amount: number } | null>(null)
  const amount = !automaticGifts && draft?.saved === value.giftAmount ? draft.amount : value.giftAmount
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const saving = useRef(false)
  async function save(next: BudgetOptions) {
    if (saving.current) return
    saving.current = true; setBusy(true); setError('')
    try { await onSave(next) } catch (reason) { setError(reason instanceof Error ? reason.message : '저장하지 못했어요.') }
    finally { saving.current = false; setBusy(false) }
  }
  return <section className="panel budget-preferences"><h2>우리의 예산 기준</h2>
    <form onSubmit={event => { event.preventDefault(); void save({ ...value, giftAmount: amount }) }}>
      <IncludeExclude label="신혼여행 비용" included={value.includeHoneymoon} disabled={busy} onChange={included => void save({ ...value, giftAmount: amount, includeHoneymoon: included })} description="포함하면 여행 견적과 결제를 총비용에 더해요."/>
      <IncludeExclude label="예상 축의금 수입" included={value.includeGifts} disabled={busy} onChange={included => void save({ ...value, giftAmount: amount, includeGifts: included })} description="포함하면 예상 수입으로 반영해 부담액에서 빼요."/>
      <label>{automaticGifts?'예상 축의금 · 자동 계산':'예상 축의금'}<MoneyInput name="giftAmount" min={0} readOnly={automaticGifts} value={amount} onValueChange={amount => setDraft({ saved: value.giftAmount, amount })} disabled={busy}/>{automaticGifts&&<small>웨딩홀 1인 식대 × 보증인원</small>}</label>
      <button className="primary" disabled={busy}>{busy ? '저장 중…' : automaticGifts?'기준 저장':'축의금 저장'}</button>
    </form>
    {error && <p className="form-error" role="alert">{error}</p>}
    <p aria-live="polite">예상 총비용 {formatWon(projectedTotal)} · 예상 부담 {formatWon(netTotal)}</p>
    <small>포함/제외 선택은 즉시 저장돼요. 예상 부담액 = 총비용 − 포함한 축의금 수입. 웨딩홀에서도 같은 설정을 사용하며, 실제 납부액과 잔금은 그대로예요.</small>
  </section>
}
