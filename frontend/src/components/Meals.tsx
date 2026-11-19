import { useEffect, useRef, useState, type ReactNode, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { FloralSwag } from './Ornaments'
import { MoneyInput } from './MoneyInput'
import { formatWon, paymentAmountLabel, summarizePayments, type Payment } from '../features/budget/budget'
import { itemQuote } from '../features/budget/estimates'
import { statusLabel, type PlanningItem } from '../features/planning/planning'
import { gatheringPeople, gatheringSideLabel, type GatheringAttendee, type GatheringSide } from '../features/planning/gatherings'
import type { GatheringInput } from '../lib/api'

type Props = { items: PlanningItem[]; payments: Payment[]; sortControls: ReactNode; onSave: (input: GatheringInput, id?: number) => Promise<void>; onPayments: (item: PlanningItem) => void; onCalendar: (date: string) => void }

export function Meals({ items, payments, sortControls, onSave, onPayments, onCalendar }: Props) {
  const [editing, setEditing] = useState<PlanningItem | 'new' | null>(null)
  const active = items.filter(item => item.status !== 'SKIPPED')
  const total = active.reduce((sum, item) => sum + itemQuote(item, []), 0)
  return <section className="page-section meals-page">
    <div className="page-title"><div><p className="eyebrow">INVITATIONS & FRIENDS</p><h1>청첩장 모임</h1><p>누구와 언제 만날지, 참석자와 장소·비용을 함께 준비해요.</p></div><button className="primary" onClick={() => setEditing('new')}>＋ 청모 추가</button></div>
    <div className="meal-overview"><span>{active.length}개의 청모 · 예정 인원 {active.reduce((sum, item) => sum + gatheringPeople(item).total, 0)}명</span><strong>예상 비용 {formatWon(total)}</strong></div>
    {sortControls}
    {!active.length ? <div className="meal-empty"><FloralSwag/><h2>소중한 사람들과의 약속을 담아봐요</h2><p>모임 이름, 장소, 참석자와 인원을 기록해요.<br/>날짜와 시간을 저장하면 캘린더에 자동으로 표시돼요.<br/>상견례 식사·선물은 준비 체크와 업체 비교에서 관리해요.</p><button className="primary" onClick={() => setEditing('new')}>첫 청모 만들기</button></div> : <div className="meal-grid">{active.map(item => {
      const summary = summarizePayments(payments.filter(payment => payment.planningItemId === item.id && payment.status !== 'CANCELLED'))
      const people = gatheringPeople(item)
      return <article className="meal-card" key={item.id}>
        <button className="meal-card-content" onClick={() => setEditing(item)}><div className="meal-card-heading"><span>{item.itemName}</span><small>{item.status === 'CONTRACTED' ? '예약 확정' : statusLabel[item.status]}</small></div><h2>{item.vendorName || '장소 미정'}</h2><p className="meal-date">{item.scheduleDate ? `${item.scheduleDate.replaceAll('-', '.')} ${item.scheduleTime?.slice(0, 5) ?? ''}` : '날짜 미정'}</p><div className="gathering-people"><strong>참석 예정 {people.total}명</strong><span>신부 측 {people.bride} · 신랑 측 {people.groom} · 공통 {people.both}{people.total > people.named ? ` · 이름 미등록 ${people.total - people.named}` : ''}</span></div><div className="gathering-names">{(item.attendees ?? []).map((person, index) => <span key={index}>{person.name}<small>{gatheringSideLabel[person.side]}</small></span>)}</div><div className="meal-card-cost"><strong>{itemQuote(item, []) ? formatWon(itemQuote(item, [])) : '예산 미입력'}</strong>{paymentAmountLabel(summary) && <small>{paymentAmountLabel(summary)}</small>}</div>{item.memo && <p className="meal-memo">{item.memo}</p>}</button>
        <div className="meal-card-actions"><button className="text-button" onClick={() => setEditing(item)}>내용 수정</button>{item.scheduleDate && <button className="text-button" onClick={() => onCalendar(item.scheduleDate!)}>캘린더 보기</button>}<button className="secondary" disabled={!item.vendorName || itemQuote(item, []) <= 0} onClick={() => onPayments(item)}>예산·결제 관리</button></div>
      </article>
    })}</div>}
    {editing && createPortal(<GatheringEditor item={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} onSave={async (input, id) => { await onSave(input, id); setEditing(null) }}/>, document.body)}
  </section>
}

function GatheringEditor({ item, onClose, onSave }: { item?: PlanningItem; onClose: () => void; onSave: Props['onSave'] }) {
  const [attendees, setAttendees] = useState<GatheringAttendee[]>(() => item?.attendees ?? [])
  const [count, setCount] = useState(() => gatheringPeople(item ?? {}).total)
  const [status, setStatus] = useState(item?.status ?? 'TODO')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const dialog = useRef<HTMLElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.querySelector<HTMLInputElement>('input')?.focus()
    return () => { previous?.focus() }
  }, [])
  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onClose()
      if (event.key !== 'Tab') return
      const controls = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled):not([type=hidden]), select:not(:disabled), textarea:not(:disabled)') ?? [])
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1)?.focus() }
      else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0]?.focus() }
    }
    document.addEventListener('keydown', keyboard)
    return () => { document.removeEventListener('keydown', keyboard) }
  }, [busy, onClose])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('')
    if (count < attendees.length) { setError('참석 인원은 입력한 이름 수 이상이어야 해요.'); return }
    setBusy(true)
    const form = new FormData(event.currentTarget)
    try { await onSave({ name: String(form.get('name')).trim(), place: String(form.get('place')).trim(), scheduleDate: String(form.get('date')) || null, scheduleTime: String(form.get('time')) || null, expectedAttendees: count, attendees: attendees.map(person => ({ ...person, name: person.name.trim() })), status, amount: Number(form.get('amount')), memo: String(form.get('memo')) }, item?.id) }
    catch (reason) { setError(reason instanceof Error ? reason.message : '청모를 저장하지 못했어요.') }
    finally { setBusy(false) }
  }
  return <div className="modal-backdrop"><section ref={dialog} className="gathering-editor" role="dialog" aria-modal="true" aria-labelledby="gathering-editor-title">
    <div className="section-heading"><div><p className="eyebrow">OUR GATHERING</p><h2 id="gathering-editor-title">{item ? '청모 수정' : '새 청모'}</h2></div><button className="icon-button" aria-label="닫기" disabled={busy} onClick={onClose}>×</button></div>
    <form onSubmit={submit}><fieldset disabled={busy} className="gathering-form-fields"><div className="editor-grid">
      <label>모임 이름<input name="name" defaultValue={item?.itemName ?? ''} placeholder="예: 대학 친구들 청모" maxLength={120} required/></label><label>장소<input name="place" defaultValue={item?.vendorName ?? ''} maxLength={160} placeholder="식당 이름·만날 장소"/></label>
      <label>날짜<input name="date" type="date" defaultValue={item?.scheduleDate ?? ''} required={status === 'SCHEDULED'}/></label><label>시간<input name="time" type="time" defaultValue={item?.scheduleTime?.slice(0, 5) ?? ''}/></label>
      <label>진행 상태<select value={status} onChange={event => setStatus(event.target.value as PlanningItem['status'])}>{(['TODO', 'SCHEDULED', 'CONTRACTED', 'DONE', 'SKIPPED'] as const).map(value => <option key={value} value={value}>{value === 'CONTRACTED' ? '예약 확정' : statusLabel[value]}</option>)}</select></label>
      <label>참석 예정 인원<input type="number" min={attendees.length} max={2000} step={1} required value={count} onChange={event => setCount(Number(event.target.value))}/></label>
      <label>예상 비용<MoneyInput name="amount" defaultValue={item?.quotedAmount ?? 0}/></label>
    </div><p className="gathering-help">날짜를 저장하면 캘린더에 자동으로 표시돼요. 참석 인원에는 이름을 아직 등록하지 않은 사람도 포함할 수 있어요.</p>
    <div className="gathering-attendee-heading"><h3>참석자 이름과 구분</h3><button type="button" className="secondary" disabled={attendees.length >= 2000} onClick={() => { setAttendees(current => [...current, { name: '', side: 'BOTH' }]); setCount(current => Math.max(current, attendees.length + 1)) }}>이름 추가</button></div>
    <div className="gathering-attendees">{attendees.map((person, index) => <div className="gathering-attendee" key={index}><label>이름 {index + 1}<input required maxLength={80} value={person.name} onChange={event => setAttendees(current => current.map((row, at) => at === index ? { ...row, name: event.target.value } : row))}/></label><label>구분<select value={person.side} onChange={event => setAttendees(current => current.map((row, at) => at === index ? { ...row, side: event.target.value as GatheringSide } : row))}>{Object.entries(gatheringSideLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><button type="button" className="text-button" aria-label={`참석자 ${index + 1} 삭제`} onClick={() => setAttendees(current => current.filter((_, at) => at !== index))}>삭제</button></div>)}</div>
    {!attendees.length && <p className="gathering-help">이름은 나중에 등록해도 괜찮아요.</p>}<label>메모<textarea name="memo" defaultValue={item?.memo ?? ''} maxLength={1000} placeholder="예약 내용이나 친구들에게 전할 말"/></label></fieldset>
    {error && <p role="alert" className="form-error">{error}</p>}<div className="identity-actions"><button type="button" className="secondary" disabled={busy} onClick={onClose}>취소</button><button className="primary" disabled={busy}>{busy ? '저장 중…' : '청모·캘린더에 저장'}</button></div></form>
  </section></div>
}
