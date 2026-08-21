"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  CandidateStatus,
  ChecklistItem,
  ChecklistStatus,
  LocalDatabase,
  Venue,
  VenueEvaluation,
  VenuePrice,
  VenueVisit,
} from "./lib/types";

const DATABASE_KEY = "wedget:venue-tour:v1";
const DRAFT_KEY = "wedget:venue-tour:draft:v1";

const evaluationTemplate: Record<string, string[]> = {
  "홀": ["홀 디자인", "꽃장식", "버진로드", "조명", "음향", "하객 시야", "실제 수용감"],
  "신부대기실": ["디자인", "크기", "채광", "사진 촬영 환경", "하객 동선"],
  "접근성": ["대중교통 접근성", "역에서 이동 편의", "건물 찾기 쉬움", "지방 하객 접근성"],
  "주차": ["차량 진입 동선", "주차 공간", "출차 편의", "혼주 주차", "대절버스 주차"],
  "하객 동선": ["로비 크기", "로비 혼잡도", "다른 예식과 동선 겹침", "엘리베이터 대기", "축의대 공간"],
  "연회장": ["연회장 동선", "테이블 간격", "좌석 확보", "혼잡도", "음식 상태", "음식 종류", "음식 리필"],
  "운영": ["예식 간격", "직원 응대", "안내 상태", "화장실", "건물 청결도"],
  "가격": ["가격 만족도", "비용 대비 만족도"],
};

const checklistTemplate: Record<string, string[]> = {
  "현장": ["실제 예식 진행 상황", "로비 혼잡도", "엘리베이터 대기", "다른 홀 하객 동선"],
  "시설": ["신부대기실 직접 보기", "연회장 직접 보기", "화장실", "ATM 위치"],
  "교통": ["버스 주차 위치", "지하철역에서 실제 걸어보기", "차량 진입로 확인"],
};

const statusLabel: Record<CandidateStatus, string> = {
  INTERESTED: "관심",
  PLANNED: "방문 예정",
  SHORTLISTED: "후보",
  ON_HOLD: "보류",
  REJECTED: "탈락",
  CONTRACTED: "계약",
};

const makeId = () => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
const today = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);
const emptyPrice = (): VenuePrice => ({ baseAndMandatoryAmount: null, pricePerGuest: null, guaranteedGuestCount: null, expectedGuestCount: null, additionalAmount: null, discountAmount: null });

function buildEvaluations(): VenueEvaluation[] {
  let order = 0;
  return Object.entries(evaluationTemplate).flatMap(([category, items]) => items.map((itemName) => ({ id: makeId(), category, itemName, status: "UNRATED" as const, rating: null, reason: "", sortOrder: order++ })));
}

function buildChecklist(): ChecklistItem[] {
  let order = 0;
  return Object.entries(checklistTemplate).flatMap(([section, items]) => items.map((itemName) => ({ id: makeId(), checklistType: "SECRET_TOUR" as const, section, itemName, status: "UNCHECKED" as const, note: "", sortOrder: order++ })));
}

function newVisit(venueId: string): VenueVisit {
  return { id: makeId(), venueId, visitType: "SECRET_TOUR", visitDate: today(), visitTime: nowTime(), priceSource: "UNKNOWN", price: emptyPrice(), evaluations: buildEvaluations(), checklistItems: buildChecklist(), pros: "", cons: "", summary: "", detail: "", revisitIntent: "MEDIUM", resultingCandidateStatus: "INTERESTED", completed: false, savedAt: new Date().toISOString() };
}

const money = (value: number | null) => value == null ? "미입력" : `${value.toLocaleString("ko-KR")}원`;
const numberOrNull = (value: string) => value === "" ? null : Math.max(0, Number(value));

function average(evaluations: VenueEvaluation[]) {
  const rated = evaluations.filter((item) => item.status === "RATED" && item.rating != null);
  if (!rated.length) return null;
  return rated.reduce((sum, item) => sum + (item.rating ?? 0), 0) / rated.length;
}

function estimate(price: VenuePrice) {
  const guests = [price.guaranteedGuestCount, price.expectedGuestCount].filter((value): value is number => value != null);
  if (price.baseAndMandatoryAmount == null || price.pricePerGuest == null || guests.length === 0 || price.additionalAmount == null || price.discountAmount == null) return null;
  return price.baseAndMandatoryAmount + Math.max(...guests) * price.pricePerGuest + price.additionalAmount - price.discountAmount;
}

export default function Home() {
  const [db, setDb] = useState<LocalDatabase>({ venues: [], visits: [] });
  const [view, setView] = useState<"home" | "tour" | "detail" | "compare">("home");
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [draft, setDraft] = useState<VenueVisit | null>(null);
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [saving, setSaving] = useState<"saved" | "saving">("saved");
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(DATABASE_KEY);
        const storedDraft = localStorage.getItem(DRAFT_KEY);
        if (stored) setDb(JSON.parse(stored));
        if (storedDraft) setDraft(JSON.parse(storedDraft));
      } catch { setNotice("저장 데이터를 읽지 못했어요. 새 기록은 정상적으로 저장됩니다."); }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(DATABASE_KEY, JSON.stringify(db));
  }, [db, hydrated]);

  useEffect(() => {
    if (!hydrated || !draft) return;
    const pending = window.setTimeout(() => setSaving("saving"), 0);
    const timer = window.setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setSaving("saved");
    }, 220);
    return () => { window.clearTimeout(pending); window.clearTimeout(timer); };
  }, [draft, hydrated]);

  const selectedVenue = db.venues.find((venue) => venue.id === selectedVenueId) ?? null;
  const selectedVisits = db.visits.filter((visit) => visit.venueId === selectedVenueId).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  const progress = useMemo(() => {
    if (!draft) return { done: 0, total: 0, percent: 0 };
    const done = draft.evaluations.filter((item) => item.status !== "UNRATED").length;
    return { done, total: draft.evaluations.length, percent: Math.round(done / draft.evaluations.length * 100) };
  }, [draft]);

  function addVenue() {
    if (!venueName.trim()) { setNotice("웨딩홀 이름을 먼저 입력해 주세요."); return; }
    const venue: Venue = { id: makeId(), name: venueName.trim(), address: venueAddress.trim(), candidateStatus: "PLANNED", createdAt: new Date().toISOString() };
    setDb((current) => ({ ...current, venues: [venue, ...current.venues] }));
    setVenueName(""); setVenueAddress(""); setNotice("웨딩홀을 추가했어요.");
  }

  function startTour(venue: Venue) {
    const next = draft?.venueId === venue.id ? draft : newVisit(venue.id);
    setSelectedVenueId(venue.id); setDraft(next); setView("tour"); window.scrollTo(0, 0);
  }

  function updateEvaluation(id: string, changes: Partial<VenueEvaluation>) {
    setDraft((current) => current ? { ...current, evaluations: current.evaluations.map((item) => item.id === id ? { ...item, ...changes } : item) } : current);
  }

  function updateChecklist(id: string, status: ChecklistStatus) {
    setDraft((current) => current ? { ...current, checklistItems: current.checklistItems.map((item) => item.id === id ? { ...item, status } : item) } : current);
  }

  function saveTour() {
    if (!draft) return;
    const saved = { ...draft, completed: true, savedAt: new Date().toISOString() };
    setDb((current) => ({ venues: current.venues.map((venue) => venue.id === saved.venueId ? { ...venue, candidateStatus: saved.resultingCandidateStatus } : venue), visits: [saved, ...current.visits.filter((visit) => visit.id !== saved.id)] }));
    localStorage.removeItem(DRAFT_KEY); setDraft(null); setSelectedVenueId(saved.venueId); setView("detail"); setNotice("암행투어 기록을 안전하게 저장했어요."); window.scrollTo(0, 0);
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `wedget-backup-${today()}.json`; anchor.click(); URL.revokeObjectURL(url);
    setNotice("백업 파일을 저장했어요.");
  }

  if (!hydrated) return <main className="loading-screen">wedget을 준비하고 있어요…</main>;

  if (view === "tour" && draft && selectedVenue) {
    const grouped = Object.keys(evaluationTemplate).map((category) => ({ category, items: draft.evaluations.filter((item) => item.category === category && (!showOnlyPending || item.status === "UNRATED")) })).filter((group) => group.items.length);
    const estimated = estimate(draft.price);
    return (
      <main className="app-shell form-shell">
        <header className="form-topbar">
          <button className="icon-button" onClick={() => setView("home")} aria-label="목록으로">←</button>
          <div><p>암행투어 기록</p><strong>{selectedVenue.name}</strong></div>
          <span className={`save-state ${saving}`}>{saving === "saving" ? "저장 중" : "자동 저장됨"}</span>
        </header>

        <section className="progress-card">
          <div><span>평가 진행률</span><strong>{progress.done}/{progress.total}</strong></div>
          <div className="progress-track"><i style={{ width: `${progress.percent}%` }} /></div>
          <small>모르는 항목은 ‘미확인’으로 넘겨도 괜찮아요.</small>
        </section>

        <section className="form-section basic-grid">
          <label>방문 날짜<input type="date" value={draft.visitDate} onChange={(event) => setDraft({ ...draft, visitDate: event.target.value })} /></label>
          <label>방문 시간<input type="time" value={draft.visitTime} onChange={(event) => setDraft({ ...draft, visitTime: event.target.value })} /></label>
        </section>

        <details className="form-section details-card">
          <summary><span><b>가격 정보</b><small>몰라도 괜찮아요</small></span><em>{money(estimated)}</em></summary>
          <div className="price-grid">
            {([
              ["baseAndMandatoryAmount", "대관·필수 비용", "원"], ["pricePerGuest", "1인 식대", "원"], ["guaranteedGuestCount", "보증 인원", "명"], ["expectedGuestCount", "예상 인원", "명"], ["additionalAmount", "기타 추가비", "원"], ["discountAmount", "할인 금액", "원"],
            ] as const).map(([key, label, suffix]) => <label key={key}>{label}<span><input inputMode="numeric" type="number" min="0" value={draft.price[key] ?? ""} placeholder="0" onChange={(event) => setDraft({ ...draft, price: { ...draft.price, [key]: numberOrNull(event.target.value) } })} /><i>{suffix}</i></span></label>)}
          </div>
          <label className="select-label">가격 출처<select value={draft.priceSource} onChange={(event) => setDraft({ ...draft, priceSource: event.target.value as VenueVisit["priceSource"] })}><option value="UNKNOWN">미확인</option><option value="ONLINE">인터넷 참고</option><option value="ACQUAINTANCE">지인 정보</option><option value="CONSULTATION_QUOTE">상담 견적</option></select></label>
          <div className="estimate-row"><span>최종 예상 비용</span><strong>{money(estimated)}</strong></div>
        </details>

        <div className="section-heading-row"><div><p className="eyebrow">RATING</p><h2>직접 본 느낌을 남겨요</h2></div><label className="switch-label"><input type="checkbox" checked={showOnlyPending} onChange={(event) => setShowOnlyPending(event.target.checked)} /> 미작성만</label></div>

        {grouped.length === 0 && <div className="empty-mini">모든 평가를 확인했어요 ✓</div>}
        {grouped.map(({ category, items }, index) => (
          <details className="evaluation-group" key={category} open={index === 0 || showOnlyPending}>
            <summary><span>{category}</span><small>{draft.evaluations.filter((item) => item.category === category && item.status !== "UNRATED").length}/{draft.evaluations.filter((item) => item.category === category).length}</small></summary>
            <div className="evaluation-list">
              {items.map((item) => <article className="evaluation-item" key={item.id}>
                <div className="evaluation-title"><strong>{item.itemName}</strong><button className={item.status === "NOT_OBSERVED" ? "skip active" : "skip"} onClick={() => updateEvaluation(item.id, { status: item.status === "NOT_OBSERVED" ? "UNRATED" : "NOT_OBSERVED", rating: null })}>미확인</button></div>
                <div className="stars" aria-label={`${item.itemName} 별점`}>
                  {[1,2,3,4,5].map((rating) => <button key={rating} aria-label={`${rating}점`} className={item.status === "RATED" && (item.rating ?? 0) >= rating ? "selected" : ""} onClick={() => updateEvaluation(item.id, { status: "RATED", rating })}>★</button>)}
                </div>
                {(item.status === "RATED" || item.reason) && <textarea rows={2} value={item.reason} placeholder="왜 그렇게 느꼈나요? 한 줄이면 충분해요." onChange={(event) => updateEvaluation(item.id, { reason: event.target.value })} />}
              </article>)}
            </div>
          </details>
        ))}

        <details className="form-section checklist-card">
          <summary><span><b>현장 체크리스트</b><small>놓치기 쉬운 것만 모았어요</small></span><em>{draft.checklistItems.filter((item) => item.status !== "UNCHECKED").length}/{draft.checklistItems.length}</em></summary>
          {Object.keys(checklistTemplate).map((section) => <div className="check-group" key={section}><h3>{section}</h3>{draft.checklistItems.filter((item) => item.section === section).map((item) => <button key={item.id} className={`check-row ${item.status.toLowerCase()}`} onClick={() => updateChecklist(item.id, item.status === "CHECKED" ? "NOT_APPLICABLE" : item.status === "NOT_APPLICABLE" ? "UNCHECKED" : "CHECKED")}><i>{item.status === "CHECKED" ? "✓" : item.status === "NOT_APPLICABLE" ? "–" : ""}</i><span>{item.itemName}</span><small>{item.status === "NOT_APPLICABLE" ? "해당 없음" : ""}</small></button>)}</div>)}
        </details>

        <section className="form-section notes-card">
          <p className="eyebrow">REVIEW</p><h2>마지막으로 정리해요</h2>
          <label>좋았던 점<textarea rows={3} value={draft.pros} placeholder="계속 생각나는 장점을 적어주세요." onChange={(event) => setDraft({ ...draft, pros: event.target.value })} /></label>
          <label>아쉬운 점<textarea rows={3} value={draft.cons} placeholder="계약 전에 꼭 확인할 부분은 무엇인가요?" onChange={(event) => setDraft({ ...draft, cons: event.target.value })} /></label>
          <label>한줄 총평<input value={draft.summary} placeholder="예: 가격만 맞으면 바로 계약하고 싶은 홀" onChange={(event) => setDraft({ ...draft, summary: event.target.value })} /></label>
          <label>상세 메모<textarea rows={4} value={draft.detail} placeholder="집에 가서 기억하고 싶은 내용을 자유롭게 적어주세요." onChange={(event) => setDraft({ ...draft, detail: event.target.value })} /></label>
          <label className="select-label">투어 후 후보 상태<select value={draft.resultingCandidateStatus} onChange={(event) => setDraft({ ...draft, resultingCandidateStatus: event.target.value as CandidateStatus })}>{Object.entries(statusLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        </section>

        <div className="sticky-save"><button className="primary-button" onClick={saveTour}>암행투어 기록 저장 <span>✓</span></button></div>
      </main>
    );
  }

  if (view === "detail" && selectedVenue) {
    return <main className="app-shell"><AppHeader onHome={() => setView("home")} onExport={exportBackup} />
      <section className="detail-hero"><button className="back-link" onClick={() => setView("home")}>← 목록</button><span className="status-badge">{statusLabel[selectedVenue.candidateStatus]}</span><h1>{selectedVenue.name}</h1><p>{selectedVenue.address || "주소 미입력"}</p><button className="primary-button compact" onClick={() => startTour(selectedVenue)}>새 방문 기록</button></section>
      {notice && <Toast text={notice} />}
      <section className="visit-list"><div className="section-title"><h2>방문 기록</h2><span>{selectedVisits.length}회</span></div>{selectedVisits.length === 0 ? <Empty text="아직 저장된 방문 기록이 없어요." /> : selectedVisits.map((visit) => { const score = average(visit.evaluations); return <article className="visit-card" key={visit.id}><div className="visit-card-top"><div><small>{visit.visitDate} · {visit.visitTime}</small><h3>{visit.summary || "암행투어 기록"}</h3></div><b>{score == null ? "–" : score.toFixed(1)}<i>/5</i></b></div><div className="visit-stats"><span>예상 비용<strong>{money(estimate(visit.price))}</strong></span><span>평가 완료<strong>{visit.evaluations.filter((item) => item.status !== "UNRATED").length}개</strong></span></div>{visit.pros && <p className="positive">좋았던 점 · {visit.pros}</p>}{visit.cons && <p className="negative">아쉬운 점 · {visit.cons}</p>}</article>})}</section>
    </main>;
  }

  if (view === "compare") {
    const compared = compareIds.map((id) => db.venues.find((venue) => venue.id === id)).filter((venue): venue is Venue => Boolean(venue));
    return <main className="app-shell"><AppHeader onHome={() => setView("home")} onExport={exportBackup} /><section className="page-heading"><p className="eyebrow">COMPARE</p><h1>웨딩홀 비교</h1><p>두 곳 이상 선택하면 최근 방문 기록을 나란히 보여드려요.</p></section><div className="compare-picker">{db.venues.map((venue) => <label key={venue.id}><input type="checkbox" checked={compareIds.includes(venue.id)} onChange={(event) => setCompareIds(event.target.checked ? [...compareIds, venue.id] : compareIds.filter((id) => id !== venue.id))} /><span>{venue.name}</span></label>)}</div>{compared.length < 2 ? <Empty text="비교할 웨딩홀을 2곳 이상 선택해 주세요." /> : <div className="compare-grid">{compared.map((venue) => { const visit = db.visits.filter((item) => item.venueId === venue.id).sort((a,b) => b.savedAt.localeCompare(a.savedAt))[0]; const score = visit ? average(visit.evaluations) : null; return <article className="compare-card" key={venue.id}><span className="status-badge">{statusLabel[venue.candidateStatus]}</span><h2>{venue.name}</h2><div className="compare-score"><b>{score == null ? "–" : score.toFixed(1)}</b><span>/ 5</span></div><dl><div><dt>예상 비용</dt><dd>{visit ? money(estimate(visit.price)) : "기록 없음"}</dd></div><div><dt>한줄 총평</dt><dd>{visit?.summary || "아직 없어요"}</dd></div><div><dt>좋았던 점</dt><dd>{visit?.pros || "아직 없어요"}</dd></div><div><dt>아쉬운 점</dt><dd>{visit?.cons || "아직 없어요"}</dd></div></dl></article>})}</div>}</main>;
  }

  return (
    <main className="app-shell home-shell">
      <AppHeader onHome={() => setView("home")} onExport={exportBackup} />
      {notice && <Toast text={notice} />}
      <section className="home-hero"><p className="eyebrow">VENUE TOUR</p><h1>내일의 웨딩홀,<br />오늘 꼼꼼히 기록해요.</h1><p>현장에서 놓치기 쉬운 동선, 주차, 연회장까지.<br />별점과 이유를 한 번에 남겨보세요.</p></section>
      {draft && db.venues.some((venue) => venue.id === draft.venueId) && <button className="resume-card" onClick={() => { setSelectedVenueId(draft.venueId); setView("tour"); }}><span>작성 중인 기록</span><strong>{db.venues.find((venue) => venue.id === draft.venueId)?.name}</strong><i>이어서 작성 →</i></button>}
      <section className="add-venue-card"><div><p className="card-kicker">NEW VENUE</p><h2>투어할 웨딩홀 추가</h2></div><label>웨딩홀 이름<input value={venueName} placeholder="예: 아펠가모 공덕" onChange={(event) => setVenueName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addVenue()} /></label><label>주소 <small>선택</small><input value={venueAddress} placeholder="현장에서 알아보기 쉽게 적어주세요" onChange={(event) => setVenueAddress(event.target.value)} /></label><button className="primary-button" onClick={addVenue}>웨딩홀 추가</button></section>
      <section className="venue-section"><div className="section-title"><h2>나의 웨딩홀</h2><button onClick={() => setView("compare")} disabled={db.venues.length < 2}>비교하기 →</button></div>{db.venues.length === 0 ? <Empty text="첫 웨딩홀을 추가하면 암행투어를 시작할 수 있어요." /> : <div className="venue-list">{db.venues.map((venue) => { const visits = db.visits.filter((visit) => visit.venueId === venue.id); const latest = visits.sort((a,b) => b.savedAt.localeCompare(a.savedAt))[0]; const score = latest ? average(latest.evaluations) : null; return <article className="venue-card" key={venue.id}><button className="venue-card-main" onClick={() => { setSelectedVenueId(venue.id); setView("detail"); }}><span className="status-badge">{statusLabel[venue.candidateStatus]}</span><h3>{venue.name}</h3><p>{venue.address || "주소 미입력"}</p><div><span>{visits.length}회 방문</span><strong>{score == null ? "평가 전" : `★ ${score.toFixed(1)}`}</strong></div></button><button className="tour-button" onClick={() => startTour(venue)}>암행투어 시작 <span>→</span></button></article>})}</div>}</section>
      <footer><strong>wedget</strong><span>내 데이터는 이 기기에 안전하게 저장됩니다.</span></footer>
    </main>
  );
}

function AppHeader({ onHome, onExport }: { onHome: () => void; onExport: () => void }) {
  return <header className="app-header"><button className="brand" onClick={onHome}>wedget</button><nav><button onClick={onExport}>백업</button><span>이 기기에 저장</span></nav></header>;
}

function Toast({ text }: { text: string }) { return <div className="toast" role="status">✓ {text}</div>; }
function Empty({ text }: { text: string }) { return <div className="empty-state"><i>✦</i><p>{text}</p></div>; }
