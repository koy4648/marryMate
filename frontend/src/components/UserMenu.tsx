import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import type { Session, Workspace } from '../lib/api'

export type IdentityField = 'nickname' | 'workspaceName' | 'weddingDate' | 'homeTitle'

type Props = {
  session: Session
  workspace?: Workspace
  onIdentity: (field: IdentityField) => void
  onInvite: () => Promise<string>
  onPassword: (current: string, next: string) => Promise<void>
  onLeave: () => Promise<void>
  onLogout: () => void
}

export function UserMenu({ session, workspace, onIdentity, onInvite, onPassword, onLeave, onLogout }: Props) {
  const [open, setOpen] = useState(false)
  const [dialog, setDialog] = useState<'password' | 'leave' | 'invite' | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const modal = useRef<HTMLElement>(null)
  const owner = workspace?.role === 'OWNER'

  useEffect(() => {
    if (!open) return
    function outside(event: PointerEvent) { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    function escape(event: KeyboardEvent) { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus() } }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [open])

  useEffect(() => {
    if (!dialog) return
    const avatar = trigger.current
    const previous = document.activeElement as HTMLElement | null
    const focusable = () => Array.from(modal.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)') ?? [])
    focusable()[0]?.focus()
    function keyboard(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) setDialog(null)
      if (event.key !== 'Tab') return
      const elements = focusable(); const first = elements[0]; const last = elements.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', keyboard)
    return () => { document.removeEventListener('keydown', keyboard); (previous?.isConnected ? previous : avatar)?.focus() }
  }, [dialog, busy])

  function start(next: NonNullable<typeof dialog>) { setOpen(false); setError(''); setCode(''); setCopied(false); setDialog(next) }
  function identity(field: IdentityField) { setOpen(false); onIdentity(field) }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError('')
    if (dialog === 'password' && form.get('newPassword') !== form.get('confirmation')) { setError('새 비밀번호가 서로 일치하지 않아요.'); return }
    setBusy(true)
    try {
      if (dialog === 'password') await onPassword(String(form.get('currentPassword')), String(form.get('newPassword')))
      if (dialog === 'leave') await onLeave()
      setDialog(null)
    } catch (reason) { setError(reason instanceof Error ? reason.message : '처리하지 못했어요.') }
    finally { setBusy(false) }
  }
  async function generateInvite() {
    setBusy(true); setError(''); setCopied(false)
    try { setCode(await onInvite()) }
    catch (reason) { setError(reason instanceof Error ? reason.message : '초대 코드를 만들지 못했어요.') }
    finally { setBusy(false) }
  }

  return <div className="user-profile" ref={root}>
    <button ref={trigger} className="user-avatar" aria-label={`${session.user.nickname} 프로필 설정`} aria-expanded={open} aria-controls="user-profile-menu" onClick={() => setOpen(!open)}>{Array.from(session.user.nickname.trim())[0] || '나'}</button>
    {open && <div id="user-profile-menu" className="user-profile-menu">
      <div className="profile-heading"><strong>{session.user.nickname}</strong><small>{session.user.email}</small>{workspace && <small>{workspace.name} · {owner ? '모임장' : '참여자'}</small>}</div>
      <button onClick={() => identity('nickname')}>이름 변경</button>
      <button onClick={() => start('password')}>비밀번호 변경</button>
      {workspace && <><hr/><button onClick={() => start('invite')}>초대 코드 만들기</button><button onClick={() => identity('workspaceName')} disabled={!owner}>모임 이름 변경</button><button onClick={() => identity('weddingDate')} disabled={!owner}>예식일 변경</button><button onClick={() => identity('homeTitle')} disabled={!owner}>메인 문구 변경</button>{!owner && <small className="profile-permission">모임 정보는 모임장이 변경할 수 있어요.</small>}<hr/><button className="profile-danger" onClick={() => start('leave')}>모임 떠나기</button></>}
      <button onClick={() => { setOpen(false); onLogout() }}>로그아웃</button>
    </div>}
    {dialog && createPortal(<div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !busy) setDialog(null) }}><section ref={modal} role="dialog" aria-modal="true" aria-labelledby="profile-dialog-title" className="identity-editor profile-dialog">
      <div className="section-heading"><h2 id="profile-dialog-title">{dialog === 'password' ? '비밀번호 변경' : dialog === 'leave' ? '모임을 떠날까요?' : '초대 코드 만들기'}</h2><button className="icon-button" aria-label="닫기" disabled={busy} onClick={() => setDialog(null)}>×</button></div>
      {dialog === 'invite' ? <><p>{workspace?.name}에 함께할 사람을 초대해요.</p>{code && <div className="profile-invite-code"><strong>{code}</strong><small>7일 안에 한 번 사용할 수 있어요.</small><button className="secondary" onClick={async () => { try { await navigator.clipboard.writeText(code); setCopied(true) } catch { setError('코드를 직접 복사해 주세요.') } }}>{copied ? '복사했어요 ✓' : '초대 코드 복사'}</button></div>}{error && <p role="alert" className="form-error">{error}</p>}<button className="primary" disabled={busy} onClick={() => void generateInvite()}>{busy ? '만드는 중…' : code ? '새 코드 만들기' : '코드 만들기'}</button></> : <form onSubmit={submit}>
        {dialog === 'password' ? <><label>현재 비밀번호<input name="currentPassword" type="password" autoComplete="current-password" required/></label><label>새 비밀번호<input name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={100} required/><small>8~100자로 입력해 주세요.</small></label><label>새 비밀번호 확인<input name="confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={100} required/></label><p>변경하면 다른 기기의 로그인은 해제돼요.</p></> : <><p><strong>{workspace?.name}</strong>의 준비 기록과 예산에 더 이상 접근할 수 없어요. 다시 참여하려면 새 초대 코드가 필요해요.</p>{owner && <p>남은 참여자가 있으면 먼저 참여한 사람에게 모임장 권한을 넘겨요.</p>}<p>기존 기록은 모임에 보관돼요. 다른 모임이 없으면 새 개인 공간으로 이동해요.</p></>}
        {error && <p role="alert" className="form-error">{error}</p>}<div className="identity-actions"><button type="button" className="secondary" disabled={busy} onClick={() => setDialog(null)}>취소</button><button className={dialog === 'leave' ? 'danger-button' : 'primary'} disabled={busy}>{busy ? '처리 중…' : dialog === 'password' ? '비밀번호 변경' : '모임 떠나기'}</button></div>
      </form>}
    </section></div>, document.body)}
  </div>
}
