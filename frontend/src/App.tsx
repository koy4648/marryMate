import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { formatWon, getPaymentTiming, summarizePayments, type Payment, type PaymentType } from './features/budget/budget'
import { api, type Budget, type Session, type Workspace } from './lib/api'
import './App.css'

const SESSION_KEY = 'marry-mate:v2:session'
const emptyBudget: Budget = { targetAmount: 0, payments: [] }
const paymentTypeLabel: Record<PaymentType, string> = { DEPOSIT:'계약금', INTERIM:'중도금', BALANCE:'잔금', EXTRA:'추가금', REFUND:'환불', OTHER:'기타' }

function Auth({ onDone }: { onDone: (session: Session) => void }) {
  const [mode,setMode]=useState<'signup'|'login'>('signup'); const [error,setError]=useState(''); const [busy,setBusy]=useState(false)
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError('');const form=new FormData(event.currentTarget);try{const session=mode==='signup'?await api.signup(String(form.get('email')),String(form.get('password')),String(form.get('nickname'))):await api.login(String(form.get('email')),String(form.get('password')));onDone(session)}catch(reason){setError(reason instanceof Error?reason.message:'로그인하지 못했어요.')}finally{setBusy(false)}}
  return <main className="auth-page"><section className="auth-card"><span className="brand-mark">m</span><p className="eyebrow">OUR WEDDING SPACE</p><h1>둘이 함께 만드는<br /><em>우리의 결혼 준비</em></h1><p>예산부터 계약금·중도금·잔금까지 같은 화면에서 확인해요.</p><div className="auth-tabs"><button className={mode==='signup'?'active':''} onClick={()=>setMode('signup')}>처음 시작하기</button><button className={mode==='login'?'active':''} onClick={()=>setMode('login')}>로그인</button></div><form onSubmit={submit}>{mode==='signup'&&<label>닉네임<input name="nickname" required maxLength={80}/></label>}<label>이메일<input name="email" type="email" required/></label><label>비밀번호<input name="password" type="password" minLength={8} required/></label>{error&&<p className="form-error">{error}</p>}<button className="primary" disabled={busy}>{busy?'연결 중…':mode==='signup'?'우리 공간 만들기':'로그인'}</button></form></section></main>
}

function App() {
  const [session,setSession]=useState<Session|null>(()=>{try{return JSON.parse(localStorage.getItem(SESSION_KEY)??'null')}catch{return null}})
  const [budget,setBudget]=useState<Budget>(emptyBudget); const [workspaces,setWorkspaces]=useState<Workspace[]>([]); const [notice,setNotice]=useState(''); const [invite,setInvite]=useState(''); const [joinCode,setJoinCode]=useState(''); const [showPayment,setShowPayment]=useState(false)
  const [today] = useState(() => new Date().toISOString().slice(0,10))
  const summary=useMemo(()=>summarizePayments(budget.payments),[budget.payments])
  async function refresh(active:Session){if(!active.workspaceId)return;try{const [nextBudget,nextWorkspaces]=await Promise.all([api.budget(active),api.workspaces(active)]);setBudget(nextBudget);setWorkspaces(nextWorkspaces)}catch(reason){setNotice(reason instanceof Error?reason.message:'데이터를 불러오지 못했어요.')}}
  // oxlint-disable-next-line react/set-state-in-effect -- remote state must refresh when the active session changes
  useEffect(()=>{if(session)void refresh(session)},[session])
  function saveSession(next:Session){localStorage.setItem(SESSION_KEY,JSON.stringify(next));setSession(next)}
  async function changeTarget(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!session)return;const amount=Number(new FormData(event.currentTarget).get('target'));setBudget(await api.target(session,amount));setNotice('목표 예산을 저장했어요.')}
  async function addPayment(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!session)return;const f=new FormData(event.currentTarget);const payment=await api.addPayment(session,{category:String(f.get('category')),title:String(f.get('title')),type:String(f.get('type')) as PaymentType,scheduledAmount:Number(f.get('amount')),dueDate:String(f.get('date')),payer:String(f.get('payer')),memo:String(f.get('memo'))});setBudget(current=>({...current,payments:[...current.payments,payment].sort((a,b)=>a.dueDate.localeCompare(b.dueDate))}));setShowPayment(false);setNotice('결제 일정을 함께 저장했어요.')}
  async function complete(payment:Payment){if(!session||payment.status==='PAID')return;const updated=await api.completePayment(session,payment.id,payment.scheduledAmount,today);setBudget(current=>({...current,payments:current.payments.map(item=>item.id===updated.id?updated:item)}))}
  async function createInvite(){if(!session)return;const result=await api.invite(session);setInvite(result.inviteCode)}
  async function join(){if(!session)return;const workspace=await api.join(session,joinCode);saveSession({...session,workspaceId:workspace.id});setJoinCode('');setNotice(`${workspace.name}에 연결됐어요.`)}
  if(!session)return <Auth onDone={saveSession}/>

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#top"><span className="brand-mark">m</span><span><strong>marry mate</strong><small>우리의 결혼 준비 공간</small></span></a><nav><a className="active" href="#dashboard">대시보드</a><a href="#budget">예산</a><a href="#schedule">결제 일정</a></nav><button className="couple-button" onClick={()=>{localStorage.removeItem(SESSION_KEY);setSession(null)}}>{session.user.nickname} · 로그아웃</button></header>
    <main id="top">
      {notice&&<div className="notice">{notice}</div>}
      <section className="workspace-card"><div><p className="eyebrow">COUPLE WORKSPACE</p><strong>{workspaces.find(w=>w.id===session.workspaceId)?.name??'우리의 결혼 준비'}</strong></div><div className="workspace-actions"><button onClick={createInvite}>초대 코드 만들기</button><label><input value={joinCode} onChange={e=>setJoinCode(e.target.value)} placeholder="받은 초대 코드"/><button onClick={join} disabled={!joinCode}>참가</button></label></div>{invite&&<button className="invite-code" onClick={()=>void navigator.clipboard.writeText(invite)}><span>남자친구에게 보내주세요</span><strong>{invite}</strong><small>눌러서 복사</small></button>}</section>
      <section className="hero" id="dashboard"><div><p className="eyebrow">TOGETHER, STEP BY STEP</p><h1>오늘도 우리답게,<br/><em>한 걸음 가까이.</em></h1><p className="hero-copy">두 휴대폰에서 같은 예산과 결제 일정을 확인해요.</p></div><form className="target-form" onSubmit={changeTarget}><label>목표 예산<input name="target" type="number" min="0" step="10000" defaultValue={budget.targetAmount}/></label><button>저장</button></form></section>
      <section className="metric-grid" id="budget"><article><span>우리의 목표 예산</span><strong>{formatWon(budget.targetAmount)}</strong><small>둘이 함께 정한 금액</small></article><article><span>등록된 결제 총액</span><strong>{formatWon(summary.paid+summary.remaining)}</strong><small>계약금·중도금·잔금</small></article><article><span>결제 완료</span><strong>{formatWon(summary.paid)}</strong><small>{summary.paidCount}건 완료</small></article><article className="accent-card"><span>앞으로 결제할 금액</span><strong>{formatWon(summary.remaining)}</strong><small>{summary.pendingCount}건 예정</small></article></section>
      <section className="panel payments-panel" id="schedule"><div className="section-heading"><div><p className="eyebrow">PAYMENT PLAN</p><h2>계약금부터 잔금까지</h2></div><button className="text-button" onClick={()=>setShowPayment(!showPayment)}>＋ 결제 추가</button></div>
        {showPayment&&<form className="payment-form" onSubmit={addPayment}><label>항목<input name="title" placeholder="예: 웨딩홀 중도금" required/></label><label>카테고리<input name="category" placeholder="웨딩홀, 본식 촬영 등" required/></label><label>구분<select name="type"><option value="DEPOSIT">계약금</option><option value="INTERIM">중도금</option><option value="BALANCE">잔금</option><option value="EXTRA">추가금</option></select></label><label>예정 금액<input name="amount" type="number" min="1" required/></label><label>결제 예정일<input name="date" type="date" required/></label><label>결제자<input name="payer" placeholder="신랑, 신부, 공동" required/></label><label className="wide">메모<input name="memo"/></label><button className="primary">공동 일정에 저장</button></form>}
        <div className="payment-list">{budget.payments.length===0?<p className="empty">아직 결제 일정이 없어요.</p>:budget.payments.map(payment=>{const timing=getPaymentTiming(payment,today);return <article className={`payment-row ${payment.status==='PAID'?'is-paid':''}`} key={payment.id}><div className={`payment-type type-${payment.type.toLowerCase()}`}>{paymentTypeLabel[payment.type]}</div><div className="payment-main"><strong>{payment.title}</strong><span>{payment.category} · {payment.dueDate.replaceAll('-','.')} · {payment.payer}</span></div><div className="payment-amount"><strong>{formatWon(payment.scheduledAmount)}</strong><span className={timing.tone}>{timing.label}</span></div><button className="status-button" disabled={payment.status==='PAID'} onClick={()=>void complete(payment)}>{payment.status==='PAID'?'완료 ✓':'결제 완료'}</button></article>})}</div>
      </section>
    </main><footer><strong>marry mate</strong><span>둘의 선택이 하나의 계획이 되는 곳</span></footer>
  </div>
}
export default App

