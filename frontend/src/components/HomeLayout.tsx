import { reorder, useSortableRows } from './SortHandle'
import { useState, type ReactNode } from 'react'
import { monthCells, type CalendarEvent } from '../features/planning/planning'

const cards = [{ id: 'intro', label: '우리 공간과 준비 현황' }, { id: 'budget', label: '예산 요약' }, { id: 'calendar', label: '캘린더' }, { id: 'upcoming', label: '다가오는 약속' }, { id: 'quick', label: '빠른 실행' }] as const
type Card = typeof cards[number]['id']
type Preferences = { order: Card[]; hidden: Card[]; calendar: 'week' | 'month' }
const defaults: Preferences = { order: cards.map(card => card.id), hidden: [], calendar: 'week' }
function readPreferences(key: string): Preferences {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null')
    if (!value) return defaults
    const valid = (id: unknown): id is Card => cards.some(card => card.id === id)
    const order = Array.isArray(value.order) ? [...new Set<Card>(value.order.filter(valid))] : []
    return { order: [...order, ...defaults.order.filter(id => !order.includes(id))], hidden: Array.isArray(value.hidden) ? value.hidden.filter(valid) : [], calendar: value.calendar === 'month' ? 'month' : 'week' }
  } catch { return defaults }
}

export function HomeLayout({ storageKey, widgets, events, today, onEvent, editing, onSettingsClose }: { editing: boolean; onSettingsClose: () => void; storageKey: string; widgets: Record<Exclude<Card, 'calendar'>, ReactNode>; events: CalendarEvent[]; today: string; onEvent: (event: CalendarEvent) => void }) {
  const [preferences, setPreferences] = useState(() => readPreferences(storageKey))
  const [error, setError] = useState('')
  function update(next: Preferences) {
    setPreferences(next)
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setError('') }
    catch { setError('이 브라우저에 설정을 저장하지 못했어요. 현재 화면에는 적용했어요.') }
  }
  function move(id: Card, direction: number) {
    const order = [...preferences.order]; const index = order.indexOf(id); const target = index + direction
    if (target < 0 || target >= order.length) return
    ;[order[index], order[target]] = [order[target], order[index]]
    update({ ...preferences, order })
  }
  const sort = useSortableRows((source, target) => update({ ...preferences, order: reorder(preferences.order, source, target) }))
  const date = new Date(`${today}T00:00:00`)
  const cells = monthCells(date.getFullYear(), date.getMonth())
  const currentWeek = Math.floor(cells.findIndex(cell => cell.date === today) / 7)
  const displayedCells = preferences.calendar === 'month' ? cells : cells.slice(currentWeek * 7, currentWeek * 7 + 7)
  return <>
    <div className="home-toolbar">{editing && <button className="secondary" onClick={onSettingsClose}>꾸미기 완료</button>}</div>
    {editing && <section id="home-settings" className="panel home-settings"><h2>내 홈 구성</h2><p>보고 싶은 카드를 고르고 손잡이를 끌어 순서를 바꿔보세요. 이 브라우저에 계정·공간별로 저장돼요.</p><div data-sort-list>{preferences.order.map((id, index) => <div className="navigation-choice-row" key={id} data-sort-row={id} data-sort-target={sort.isTarget(id) || undefined}><span className="sort-handle" aria-hidden="true" title="끌어서 순서 바꾸기" {...sort.handle(id)}>⠿</span><label><input type="checkbox" checked={!preferences.hidden.includes(id)} onChange={event => update({ ...preferences, hidden: event.target.checked ? preferences.hidden.filter(value => value !== id) : [...preferences.hidden, id] })}/>{cards.find(card => card.id === id)!.label}</label><div className="navigation-move-controls"><button disabled={index === 0} aria-label={`${cards.find(card => card.id === id)!.label} 위로 이동`} onClick={() => move(id, -1)}>위로</button><button disabled={index === preferences.order.length - 1} aria-label={`${cards.find(card => card.id === id)!.label} 아래로 이동`} onClick={() => move(id, 1)}>아래로</button></div></div>)}</div><button className="secondary" onClick={() => update(defaults)}>기본 구성으로</button></section>}
    {error && <p role="alert" className="form-error">{error}</p>}
    <div className="home-cards">{preferences.order.filter(id => !preferences.hidden.includes(id)).map(id => <div key={id} className={`home-card home-card-${id}`}>{id !== 'calendar' ? widgets[id] : <section className="calendar-panel home-calendar"><div className="section-heading"><div><p className="eyebrow">우리의 날짜들</p><h2>{date.getFullYear()}년 {date.getMonth() + 1}월</h2></div><div className="home-calendar-options" role="group" aria-label="홈 캘린더 표시 범위">{(['week', 'month'] as const).map(mode => <button key={mode} className="secondary" aria-pressed={preferences.calendar === mode} onClick={() => update({ ...preferences, calendar: mode })}>{mode === 'week' ? '이번 주' : '한 달'}</button>)}</div></div><div className="weekdays">{['일', '월', '화', '수', '목', '금', '토'].map(day => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{displayedCells.map(cell => <article key={cell.date} className={`${cell.currentMonth ? '' : 'outside'} ${cell.date === today ? 'today' : ''}`}><time dateTime={cell.date}>{cell.day}</time><div>{events.filter(event => event.date === cell.date).map(event => <button key={event.id} className={`${event.kind} ${event.done ? 'event-done' : ''}`} onClick={() => onEvent(event)}><strong>{event.time && `${event.time} `}{event.title}</strong><small>{event.detail}</small></button>)}</div></article>)}</div></section>}</div>)}</div>
    {preferences.hidden.length === cards.length && <p className="empty">프로필의 홈 꾸미기에서 보고 싶은 카드를 선택해 주세요.</p>}
  </>
}
