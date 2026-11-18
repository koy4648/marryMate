import { useEffect, useRef, useState, type FormEvent } from 'react'
import { FloralSwag, MonogramMark } from './Ornaments'
import type { Workspace } from '../lib/api'

type Props = {
  nickname: string
  workspaces?: Workspace[]
  activeId?: number | null
  onCreate: (name: string, date: string | null) => Promise<void>
  onJoin: (code: string) => Promise<void>
  onSwitch?: (id: number) => void
  onClose?: () => void
  onLogout?: () => void
}

export function SpaceWelcome({ nickname, workspaces = [], activeId, onCreate, onJoin, onSwitch, onClose, onLogout }: Props) {
  const root = useRef<HTMLElement>(null)
  const [choice, setChoice] = useState<'create' | 'join' | null>(null)
  const [unknown, setUnknown] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!onClose) return
    const previous = document.activeElement as HTMLElement | null
    const focusable = () => Array.from(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)') ?? [])
    focusable()[0]?.focus()
    function keyboard(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onClose?.()
      if (event.key !== 'Tab') return
      const elements = focusable(); const first = elements[0]; const last = elements.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', keyboard)
    return () => { document.removeEventListener('keydown', keyboard); if (previous?.isConnected) previous.focus() }
  }, [onClose, busy])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true); setError('')
    try {
      if (choice === 'create') await onCreate(String(form.get('name')).trim(), unknown ? null : String(form.get('weddingDate')))
      else await onJoin(String(form.get('code')).trim())
    } catch (reason) { setError(reason instanceof Error ? reason.message : '연결하지 못했어요. 다시 시도해 주세요.') }
    finally { setBusy(false) }
  }
  return <section ref={root} className="space-welcome" aria-labelledby="space-welcome-title">
    <div className="space-welcome-top"><span className="eyebrow">A PLACE FOR TWO</span>{onClose && <button className="icon-button" aria-label="닫기" disabled={busy} onClick={onClose}>×</button>}</div>
    <MonogramMark className="space-welcome-mark"/>
    <h1 id="space-welcome-title">우리의 시작을<br/><em>어디에 담아볼까요?</em></h1>
    <p>{nickname}님, 둘만의 스페이스에서<br/>고민도, 약속도, 설레는 순간도 함께 모아요.</p>
    {workspaces.length > 0 && <div className="space-existing"><span>참여 중인 스페이스</span>{workspaces.map(space => <button key={space.id} disabled={busy || space.id === activeId} onClick={() => onSwitch?.(space.id)}>{space.name}<small>{space.id === activeId ? '현재 공간' : '열기 →'}</small></button>)}</div>}
    <div className="space-choices" role="group" aria-label="스페이스 시작 방법">
      <button className={choice === 'create' ? 'selected' : ''} aria-pressed={choice === 'create'} disabled={busy} onClick={() => { setChoice('create'); setError('') }}><span className="space-choice-icon" aria-hidden="true">＋</span><strong>새 스페이스 만들기</strong><small>우리의 첫 페이지를 열어요</small><span className="space-choice-arrow" aria-hidden="true">↗</span></button>
      <button className={choice === 'join' ? 'selected' : ''} aria-pressed={choice === 'join'} disabled={busy} onClick={() => { setChoice('join'); setError('') }}><span className="space-choice-icon" aria-hidden="true">♡</span><strong>초대코드로 참여하기</strong><small>먼저 시작한 상대와 연결해요</small><span className="space-choice-arrow" aria-hidden="true">↗</span></button>
    </div>
    {choice && <form key={choice} className="space-entry-form" onSubmit={submit}>
      {choice === 'create' ? <><label>스페이스 이름<input name="name" placeholder="예: 영서와 지우의 결혼 준비" maxLength={120} required autoFocus disabled={busy}/></label><label className="unknown-date"><input type="checkbox" checked={unknown} onChange={event => setUnknown(event.target.checked)} disabled={busy}/>예식일은 천천히 정할게요</label>{!unknown && <label>예식 날짜<input name="weddingDate" type="date" required disabled={busy}/></label>}<small>이름과 예식일은 나중에 설정에서 바꿀 수 있어요.</small></> : <><label>받은 초대코드<input className="space-code-input" name="code" placeholder="8자리 초대코드" autoComplete="off" autoCapitalize="characters" spellCheck={false} minLength={8} maxLength={8} required autoFocus disabled={busy}/></label><small>상대방이 프로필 설정에서 만든 코드를 입력해 주세요.</small></>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary" disabled={busy}>{busy ? '연결하는 중…' : choice === 'create' ? '우리의 스페이스 만들기' : '함께 준비 시작하기'}</button>
    </form>}
    {!choice && <FloralSwag className="space-welcome-floral"/>}
    {onLogout && <button className="text-button space-welcome-logout" disabled={busy} onClick={onLogout}>다른 계정으로 로그인</button>}
  </section>
}
