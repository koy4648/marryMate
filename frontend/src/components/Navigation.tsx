import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { api, type Session } from '../lib/api'

import { navigationItems, allMenus, normalizeMenuOrder, moveMenu, type View } from '../features/workspace/navigation'
export type { View } from '../features/workspace/navigation'

export function Navigation({ session, active, onNavigate, settingsRequest }: { settingsRequest: number; session: Session; active: View; onNavigate: (view: View) => void }) {
  const [saved, setSaved] = useState<{ userId: number; menus: View[] } | null>(null)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<View[]>(allMenus)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const trigger = useRef<HTMLElement | null>(null)
  const dialog = useRef<HTMLElement>(null)
  const visible = saved?.userId === session.user.id ? saved.menus : allMenus
  const [lastRequest, setLastRequest] = useState(settingsRequest)
  if (settingsRequest !== lastRequest) {
    setLastRequest(settingsRequest)
    setDraft([...visible])
    setOpen(true)
  }
  useEffect(() => {
    if (open) trigger.current = document.querySelector<HTMLElement>('.user-avatar')
  }, [open])
  useEffect(() => {
    let cancelled = false
    api.navigation(session).then(menus => { if (!cancelled) setSaved({ userId: session.user.id, menus: normalizeMenuOrder(menus) }) }).catch(() => { if (!cancelled) setError('메뉴 설정을 불러오지 못했어요. 저장을 다시 시도해 주세요.') })
    return () => { cancelled = true }
  }, [session])
  useEffect(() => {
    if (!open) return
    const button = trigger.current
    dialog.current?.querySelector<HTMLInputElement>('input:not(:disabled)')?.focus()
    function keyboard(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) setOpen(false)
      if (event.key !== 'Tab') return
      const controls = Array.from(dialog.current?.querySelectorAll<HTMLElement>('input:not(:disabled),button:not(:disabled)') ?? [])
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1)?.focus() }
      else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0]?.focus() }
    }
    document.addEventListener('keydown', keyboard)
    return () => { document.removeEventListener('keydown', keyboard); button?.focus() }
  }, [open, busy])
  async function save() {
    setBusy(true); setError('')
    try {
      const menus = await api.saveNavigation(session, draft)
      const next = normalizeMenuOrder(menus)
      setSaved({ userId: session.user.id, menus: next }); setOpen(false)
      if (!next.includes(active)) onNavigate('dashboard')
    } catch (reason) { setError(reason instanceof Error ? reason.message : '메뉴 설정을 저장하지 못했어요.') }
    finally { setBusy(false) }
  }
  return <><nav aria-label="주 메뉴">{visible.map(id => navigationItems.find(item => item.id === id)!).map(item => <button key={item.id} className={active === item.id ? 'active' : ''} aria-current={active === item.id ? 'page' : undefined} onClick={() => onNavigate(item.id)}>{item.label}</button>)}</nav>
    {open && createPortal(<div className="modal-backdrop"><section ref={dialog} className="identity-editor navigation-settings" role="dialog" aria-modal="true" aria-labelledby="navigation-settings-title"><div className="section-heading"><h2 id="navigation-settings-title">내 메뉴 설정</h2><button className="icon-button" disabled={busy} aria-label="닫기" onClick={() => setOpen(false)}>×</button></div><p>표시할 메뉴를 고르고 앞으로·뒤로 버튼으로 순서를 바꾸세요. 적용하면 내 계정에 저장돼 다른 기기에서도 유지돼요.</p><form onSubmit={event => { event.preventDefault(); void save() }}><div className="navigation-choices">{[...draft,...allMenus.filter(id=>!draft.includes(id))].map(id=>{
      const item=navigationItems.find(item=>item.id===id)!
      const position=draft.indexOf(id)
      return <div className="navigation-choice-row" key={id}><label><input type="checkbox" disabled={busy||id==='dashboard'} checked={position>=0} onChange={event=>setDraft(current=>event.target.checked?[...current,id]:current.filter(value=>value!==id))}/><span>{item.label}</span>{id==='dashboard'&&<small>항상 표시</small>}</label><div className="navigation-move-controls"><button type="button" disabled={busy||position<=0} aria-label={`${item.label} 앞으로 이동`} onClick={()=>setDraft(current=>moveMenu(current,id,-1))}>앞으로</button><button type="button" disabled={busy||position<0||position===draft.length-1} aria-label={`${item.label} 뒤로 이동`} onClick={()=>setDraft(current=>moveMenu(current,id,1))}>뒤로</button></div></div>
    })}</div>{error && <p className="form-error" role="alert">{error}</p>}<div className="identity-actions"><button type="button" className="secondary" disabled={busy} onClick={() => setDraft(current=>[...current,...allMenus.filter(id=>!current.includes(id))])}>전체 선택</button><button type="button" className="secondary" disabled={busy} onClick={()=>setDraft([...allMenus])}>기본 순서</button><button className="primary" disabled={busy}>{busy ? '저장 중…' : '적용'}</button></div></form></section></div>, document.body)}
  </>
}
