"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  CandidateStatus,
  ChecklistItem,
  ContractIntent,
  DealBreaker,
  EvaluationCategory,
  FinalAssessment,
  LocalDatabase,
  Venue,
  VenueEvaluation,
  VenuePrice,
  VenueVisit,
} from "../lib/types";
import { keyFactCodes, sectionLabel, tourSections } from "./catalog";
import {
  answerLabel,
  estimate,
  fulfillment,
  itemConditionMet,
  makeId,
  money,
  newVisit,
  parseDatabase,
  progressOf,
  sectionAverage,
  today,
} from "./domain";

const DATABASE_KEY = "marrymate:venue-tour:v2";
const DRAFT_KEY = "marrymate:venue-tour:draft:v2";
const LEGACY_DATABASE_KEY = "wedget:venue-tour:v1";
const LEGACY_DRAFT_KEY = "wedget:venue-tour:draft:v1";

type VenueRoute = { view: "home" | "compare" | "detail" | "tour"; venueId?: string };

const candidateLabel: Record<CandidateStatus, string> = {
  INTERESTED: "관심",
  PLANNED: "방문 예정",
  SHORTLISTED: "적극 후보",
  ON_HOLD: "보류",
  REJECTED: "탈락",
  CONTRACTED: "계약",
};

const contractLabel: Record<ContractIntent, string> = {
  STRONG_CANDIDATE: "적극 후보",
  CONSIDERING: "고민",
  ON_HOLD: "보류",
  REJECT: "탈락",
};

const dealBreakerLabel: Record<DealBreaker, string> = {
  PRICE: "가격",
  CAPACITY: "좌석·수용인원",
  CEREMONY_INTERVAL: "예식 간격",
  ACCESSIBILITY: "접근성",
  PARKING: "주차",
  GUEST_FLOW: "하객 동선",
  BRIDAL_WAITING_ROOM: "신부대기실",
  BANQUET: "식사",
  OTHER: "기타",
};

function readVenueRoute(pathname: string): VenueRoute {
  if (pathname === "/venues/compare") return { view: "compare" };
  const tourMatch = pathname.match(/^\/venues\/([^/]+)\/visits\/new\/?$/);
  if (tourMatch) return { view: "tour", venueId: decodeURIComponent(tourMatch[1]) };
  const detailMatch = pathname.match(/^\/venues\/([^/]+)\/?$/);
  if (detailMatch) return { view: "detail", venueId: decodeURIComponent(detailMatch[1]) };
  return { view: "home" };
}

function routePath(view: VenueRoute["view"], venueId?: string) {
  if (view === "compare") return "/venues/compare";
  if (view === "detail" && venueId) return `/venues/${encodeURIComponent(venueId)}`;
  if (view === "tour" && venueId) return `/venues/${encodeURIComponent(venueId)}/visits/new`;
  return "/venues";
}

function numberOrNull(value: string) {
  return value === "" ? null : Math.max(0, Number(value));
}

export default function VenueTourApp() {
  const [db, setDb] = useState<LocalDatabase>({ schemaVersion: 2, venues: [], visits: [] });
  const [view, setView] = useState<VenueRoute["view"]>("home");
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [draft, setDraft] = useState<VenueVisit | null>(null);
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [saving, setSaving] = useState<"saved" | "saving">("saved");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const currentRaw = localStorage.getItem(DATABASE_KEY);
        const legacyRaw = localStorage.getItem(LEGACY_DATABASE_KEY);
        const parsed = parseDatabase(currentRaw ?? legacyRaw);
        const currentDraft = localStorage.getItem(DRAFT_KEY);
        const legacyDraft = localStorage.getItem(LEGACY_DRAFT_KEY);
        let restoredDraft: VenueVisit | null = null;
        if (currentDraft) restoredDraft = JSON.parse(currentDraft) as VenueVisit;
        else if (legacyDraft) restoredDraft = parseDatabase(JSON.stringify({ visits: [JSON.parse(legacyDraft)] })).database.visits[0] ?? null;

        const route = readVenueRoute(window.location.pathname);
        setDb(parsed.database);
        setView(route.view);
        setSelectedVenueId(route.venueId ?? null);
        if (route.view === "tour" && route.venueId) {
          setDraft(restoredDraft?.venueId === route.venueId ? restoredDraft : newVisit(route.venueId));
        } else {
          setDraft(restoredDraft);
        }
        if (parsed.migrated || legacyDraft) setNotice("기존 Wedget 기록을 Marry Mate 형식으로 안전하게 옮겼어요.");
      } catch {
        setNotice("저장 데이터를 읽지 못했어요. 새 기록은 정상적으로 저장됩니다.");
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const syncRoute = () => {
      const route = readVenueRoute(window.location.pathname);
      setView(route.view);
      setSelectedVenueId(route.venueId ?? null);
      if (route.view === "tour" && route.venueId) {
        setDraft((current) => current?.venueId === route.venueId ? current : newVisit(route.venueId!));
      }
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, [hydrated]);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(DATABASE_KEY, JSON.stringify(db));
  }, [db, hydrated]);

  useEffect(() => {
    if (!hydrated || !draft) return;
    const pending = window.setTimeout(() => setSaving("saving"), 0);
    const timer = window.setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setSaving("saved");
    }, 250);
    return () => { window.clearTimeout(pending); window.clearTimeout(timer); };
  }, [draft, hydrated]);

  const selectedVenue = db.venues.find((venue) => venue.id === selectedVenueId) ?? null;
  const selectedVisits = db.visits.filter((visit) => visit.venueId === selectedVenueId).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  const progress = useMemo(() => draft ? progressOf(draft) : { done: 0, total: 0, percent: 0 }, [draft]);

  function navigate(nextView: VenueRoute["view"], venueId?: string) {
    window.history.pushState({}, "", routePath(nextView, venueId));
    setView(nextView);
    setSelectedVenueId(venueId ?? null);
    window.scrollTo(0, 0);
  }

  function addVenue() {
    if (!venueName.trim()) { setNotice("웨딩홀 이름을 먼저 입력해 주세요."); return; }
    const venue: Venue = { id: makeId(), name: venueName.trim(), address: venueAddress.trim(), candidateStatus: "PLANNED", createdAt: new Date().toISOString() };
    setDb((current) => ({ ...current, venues: [venue, ...current.venues] }));
    setVenueName("");
    setVenueAddress("");
    setNotice("웨딩홀을 추가했어요.");
  }

  function startTour(venue: Venue) {
    setDraft((current) => current?.venueId === venue.id ? current : newVisit(venue.id));
    navigate("tour", venue.id);
  }

  function updateChecklist(id: string, changes: Partial<ChecklistItem>) {
    setDraft((current) => current ? {
      ...current,
      checklistItems: current.checklistItems.map((item) => item.id === id ? { ...item, ...changes } : item),
    } : null);
  }

  function updateEvaluation(category: EvaluationCategory, changes: Partial<VenueEvaluation>) {
    setDraft((current) => current ? {
      ...current,
      evaluations: current.evaluations.map((item) => item.category === category ? { ...item, ...changes } : item),
    } : null);
  }

  function updateFinal(changes: Partial<FinalAssessment>) {
    setDraft((current) => current ? { ...current, finalAssessment: { ...current.finalAssessment, ...changes } } : null);
  }

  function saveTour() {
    if (!draft) return;
    const saved = { ...draft, completed: true, savedAt: new Date().toISOString() };
    setDb((current) => ({
      ...current,
      venues: current.venues.map((venue) => venue.id === saved.venueId ? { ...venue, candidateStatus: saved.resultingCandidateStatus } : venue),
      visits: [saved, ...current.visits.filter((visit) => visit.id !== saved.id)],
    }));
    localStorage.removeItem(DRAFT_KEY);
    setDraft(null);
    navigate("detail", saved.venueId);
    setNotice("암행투어 기록을 안전하게 저장했어요.");
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `marrymate-backup-${today()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("백업 파일을 저장했어요.");
  }

  if (!hydrated) return <main className="loading-screen">Marry Mate를 준비하고 있어요…</main>;

  if (view === "tour" && draft && selectedVenue) {
    const score = fulfillment(draft.checklistItems);
    return (
      <main className="app-shell form-shell">
        <header className="form-topbar">
          <button className="icon-button" onClick={() => navigate("home")} aria-label="웨딩홀 목록으로">←</button>
          <div><p>암행투어 기록</p><strong>{selectedVenue.name}</strong></div>
          <span className={`save-state ${saving}`}>{saving === "saving" ? "저장 중" : "자동 저장됨"}</span>
        </header>

        <section className="progress-card">
          <div><span>현장 기록 진행률</span><strong>{progress.percent}%</strong></div>
          <div className="progress-track"><i style={{ width: `${progress.percent}%` }} /></div>
          <small>{progress.done}/{progress.total} 완료 · 모르는 내용은 미확인으로 넘겨도 괜찮아요.</small>
        </section>

        <section className="form-section basic-grid">
          <label>방문 날짜<input type="date" value={draft.visitDate} onChange={(event) => setDraft({ ...draft, visitDate: event.target.value })} /></label>
          <label>방문 시간<input type="time" value={draft.visitTime} onChange={(event) => setDraft({ ...draft, visitTime: event.target.value })} /></label>
        </section>

        <div className="section-heading-row">
          <div><p className="eyebrow">FIELD NOTE</p><h1>본 것과 느낀 것을<br />나눠서 기록해요.</h1></div>
          <div className="fulfillment-mini"><strong>{score.percent == null ? "–" : `${score.percent}%`}</strong><span>조건 충족도</span></div>
        </div>

        {tourSections.map((section, index) => {
          const items = draft.checklistItems.filter((item) => item.section === section.category);
          const evaluation = draft.evaluations.find((item) => item.category === section.category)!;
          const done = items.filter((item) => item.observationStatus !== "UNANSWERED").length;
          return (
            <details className="tour-section" key={section.category} open={index === 0}>
              <summary>
                <span className="section-number">{String(index + 1).padStart(2, "0")}</span>
                <span><b>{section.label}</b><small>{section.description}</small></span>
                <em>{done}/{items.length}</em>
              </summary>
              <div className="checklist-fields">
                {items.map((item) => <ChecklistField item={item} key={item.id} onChange={(changes) => updateChecklist(item.id, changes)} />)}
              </div>
              <section className="section-satisfaction">
                <div className="evaluation-title">
                  <div><small>MY SATISFACTION</small><h3>{section.satisfactionLabel}</h3></div>
                  <button className={evaluation.status === "NOT_OBSERVED" ? "skip active" : "skip"} onClick={() => updateEvaluation(section.category, { status: "NOT_OBSERVED", rating: null })}>미평가</button>
                </div>
                <RatingInput value={evaluation.rating} onChange={(rating) => updateEvaluation(section.category, { status: "RATED", rating })} />
                <textarea rows={3} value={evaluation.reason} placeholder="왜 그렇게 느꼈나요? 비교할 때 가장 도움이 되는 기록이에요." onChange={(event) => updateEvaluation(section.category, { reason: event.target.value })} />
              </section>
            </details>
          );
        })}

        <details className="form-section details-card">
          <summary><span><b>가격 정보</b><small>가격을 모르면 비워두세요</small></span><em>{money(estimate(draft.price))}</em></summary>
          <PriceFields price={draft.price} onChange={(price) => setDraft({ ...draft, price })} />
          <label className="select-label">가격 출처<select value={draft.priceSource} onChange={(event) => setDraft({ ...draft, priceSource: event.target.value as VenueVisit["priceSource"] })}><option value="UNKNOWN">미확인</option><option value="ONLINE">온라인 참고</option><option value="ACQUAINTANCE">지인 정보</option><option value="CONSULTATION_QUOTE">상담 견적</option></select></label>
          <div className="estimate-row"><span>최종 예상 비용</span><strong>{money(estimate(draft.price))}</strong></div>
        </details>

        <FinalAssessmentForm value={draft.finalAssessment} onChange={updateFinal} />

        <section className="form-section decision-card">
          <label className="select-label">투어 후 후보 상태<select value={draft.resultingCandidateStatus} onChange={(event) => setDraft({ ...draft, resultingCandidateStatus: event.target.value as CandidateStatus })}>{Object.entries(candidateLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        </section>

        <div className="sticky-save"><button className="primary-button" onClick={saveTour}>암행투어 기록 저장 <span>✓</span></button></div>
      </main>
    );
  }

  if (view === "detail" && selectedVenue) {
    return (
      <main className="app-shell">
        <ModuleHeader onHome={() => navigate("home")} onExport={exportBackup} />
        <section className="detail-hero"><button className="back-link" onClick={() => navigate("home")}>← 목록</button><span className="status-badge">{candidateLabel[selectedVenue.candidateStatus]}</span><h1>{selectedVenue.name}</h1><p>{selectedVenue.address || "주소 미입력"}</p><button className="primary-button compact" onClick={() => startTour(selectedVenue)}>새 암행투어</button></section>
        {notice && <Toast text={notice} />}
        <section className="visit-list">
          <div className="section-title"><h2>방문 기록</h2><span>{selectedVisits.length}회</span></div>
          {selectedVisits.length === 0 ? <Empty text="아직 저장된 방문 기록이 없어요." /> : selectedVisits.map((visit) => <VisitCard visit={visit} key={visit.id} />)}
        </section>
      </main>
    );
  }

  if (view === "compare") {
    const compared = compareIds.map((id) => db.venues.find((venue) => venue.id === id)).filter((venue): venue is Venue => Boolean(venue));
    return (
      <main className="app-shell compare-shell">
        <ModuleHeader onHome={() => navigate("home")} onExport={exportBackup} />
        <section className="page-heading"><p className="eyebrow">COMPARE</p><h1>웨딩홀 비교</h1><p>점수 하나가 아니라 실제 조건과 평가 이유까지 함께 비교해요.</p></section>
        <div className="compare-picker">{db.venues.map((venue) => <label key={venue.id}><input type="checkbox" checked={compareIds.includes(venue.id)} onChange={(event) => setCompareIds(event.target.checked ? [...compareIds, venue.id] : compareIds.filter((id) => id !== venue.id))} /><span>{venue.name}</span></label>)}</div>
        {compared.length < 2 ? <Empty text="비교할 웨딩홀을 2곳 이상 선택해 주세요." /> : <div className="compare-grid">{compared.map((venue) => <CompareCard venue={venue} visit={db.visits.filter((item) => item.venueId === venue.id && item.completed).sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0] ?? null} key={venue.id} />)}</div>}
      </main>
    );
  }

  return (
    <main className="app-shell home-shell">
      <ModuleHeader onHome={() => navigate("home")} onExport={exportBackup} />
      {notice && <Toast text={notice} />}
      <section className="home-hero"><p className="eyebrow">VENUE TOUR</p><h1>내일의 웨딩홀,<br />오늘 꼼꼼히 기록해요.</h1><p>현장에서 확인한 사실과 내가 느낀 만족도를 나눠 남기고,<br />집에 돌아와 후회 없이 비교해보세요.</p></section>
      {draft && db.venues.some((venue) => venue.id === draft.venueId) && <button className="resume-card" onClick={() => { const venue = db.venues.find((item) => item.id === draft.venueId); if (venue) startTour(venue); }}><span>작성 중인 암행투어</span><strong>{db.venues.find((venue) => venue.id === draft.venueId)?.name}</strong><i>{progressOf(draft).percent}% · 이어서 작성 →</i></button>}
      <section className="add-venue-card"><div><p className="card-kicker">NEW VENUE</p><h2>투어할 웨딩홀 추가</h2></div><label>웨딩홀 이름<input value={venueName} placeholder="예: 아펠가모 공덕" onChange={(event) => setVenueName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addVenue()} /></label><label>주소 <small>선택</small><input value={venueAddress} placeholder="현장에서 알아보기 쉽게 적어주세요" onChange={(event) => setVenueAddress(event.target.value)} /></label><button className="primary-button" onClick={addVenue}>웨딩홀 추가</button></section>
      <section className="venue-section"><div className="section-title"><h2>나의 웨딩홀</h2><button onClick={() => navigate("compare")} disabled={db.venues.length < 2}>비교하기 →</button></div>{db.venues.length === 0 ? <Empty text="첫 웨딩홀을 추가하면 암행투어를 시작할 수 있어요." /> : <div className="venue-list">{db.venues.map((venue) => { const visits = db.visits.filter((visit) => visit.venueId === venue.id); const latest = visits.sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0]; return <article className="venue-card" key={venue.id}><button className="venue-card-main" onClick={() => navigate("detail", venue.id)}><span className="status-badge">{candidateLabel[venue.candidateStatus]}</span><h3>{venue.name}</h3><p>{venue.address || "주소 미입력"}</p><div><span>{visits.length}회 방문</span><strong>{latest?.finalAssessment.overallSatisfaction == null ? "평가 전" : `★ ${latest.finalAssessment.overallSatisfaction.toFixed(1)}`}</strong></div></button><button className="tour-button" onClick={() => startTour(venue)}>암행투어 시작 <span>→</span></button></article>; })}</div>}</section>
      <footer><strong>marry mate</strong><span>내 기록은 현재 이 기기에 저장됩니다.</span></footer>
    </main>
  );
}

function ChecklistField({ item, onChange }: { item: ChecklistItem; onChange: (changes: Partial<ChecklistItem>) => void }) {
  const condition = itemConditionMet(item);
  const setAnswer = (answer: ChecklistItem["answer"]) => onChange({ answer, observationStatus: answer === null || answer === "" ? "UNANSWERED" : "OBSERVED" });
  return (
    <article className={`check-field ${item.observationStatus.toLowerCase()}`}>
      <div className="check-field-head"><strong>{item.itemName}</strong><div><button className={item.observationStatus === "NOT_OBSERVED" ? "active" : ""} onClick={() => onChange({ observationStatus: item.observationStatus === "NOT_OBSERVED" ? "UNANSWERED" : "NOT_OBSERVED", answer: null })}>미확인</button><button className={item.observationStatus === "NOT_APPLICABLE" ? "active" : ""} onClick={() => onChange({ observationStatus: item.observationStatus === "NOT_APPLICABLE" ? "UNANSWERED" : "NOT_APPLICABLE", answer: null })}>해당 없음</button></div></div>
      {item.observationStatus !== "NOT_OBSERVED" && item.observationStatus !== "NOT_APPLICABLE" && (
        <div className="check-input">
          {item.inputType === "BOOLEAN" && <div className="boolean-buttons"><button className={item.observationStatus === "OBSERVED" && item.answer === true ? "selected" : ""} onClick={() => setAnswer(true)}>예</button><button className={item.observationStatus === "OBSERVED" && item.answer === false ? "selected" : ""} onClick={() => setAnswer(false)}>아니오</button></div>}
          {item.inputType === "NUMBER" && <div className="unit-input"><input type="number" min="0" inputMode="decimal" value={typeof item.answer === "number" ? item.answer : ""} placeholder="숫자 입력" onChange={(event) => setAnswer(numberOrNull(event.target.value))} /><span>{item.unit}</span></div>}
          {item.inputType === "TEXT" && <input value={typeof item.answer === "string" ? item.answer : ""} placeholder="확인한 내용을 입력하세요" onChange={(event) => setAnswer(event.target.value)} />}
          {item.inputType === "SINGLE_SELECT" && <select value={typeof item.answer === "string" ? item.answer : ""} onChange={(event) => setAnswer(event.target.value)}><option value="">선택</option>{item.options?.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select>}
        </div>
      )}
      {item.observationStatus === "NOT_OBSERVED" && <p className="skipped-copy">현장에서 확인하지 못한 항목이에요.</p>}
      {item.observationStatus === "NOT_APPLICABLE" && <p className="skipped-copy">이 웨딩홀에는 해당하지 않는 항목이에요.</p>}
      {condition === true && <span className="condition-badge success">✓ {item.condition?.successLabel}</span>}
      {condition === false && <span className="condition-badge fail">조건 미충족</span>}
      {item.observationStatus === "OBSERVED" && <input className="item-note" value={item.note} placeholder="추가 메모 (선택)" onChange={(event) => onChange({ note: event.target.value })} />}
    </article>
  );
}

function RatingInput({ value, onChange }: { value: number | null; onChange: (rating: number) => void }) {
  return <div className="rating-scale" role="radiogroup" aria-label="만족도">{[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((rating) => <button role="radio" aria-checked={value === rating} className={value === rating ? "selected" : ""} onClick={() => onChange(rating)} key={rating}>{rating}</button>)}</div>;
}

function PriceFields({ price, onChange }: { price: VenuePrice; onChange: (price: VenuePrice) => void }) {
  return <div className="price-grid">{([
    ["baseAndMandatoryAmount", "대관·필수 비용", "원"],
    ["pricePerGuest", "1인 식대", "원"],
    ["guaranteedGuestCount", "보증 인원", "명"],
    ["expectedGuestCount", "예상 인원", "명"],
    ["additionalAmount", "기타 추가비", "원"],
    ["discountAmount", "할인 금액", "원"],
  ] as const).map(([key, label, suffix]) => <label key={key}>{label}<span><input inputMode="numeric" type="number" min="0" value={price[key] ?? ""} placeholder="0" onChange={(event) => onChange({ ...price, [key]: numberOrNull(event.target.value) })} /><i>{suffix}</i></span></label>)}</div>;
}

function FinalAssessmentForm({ value, onChange }: { value: FinalAssessment; onChange: (changes: Partial<FinalAssessment>) => void }) {
  function toggleDealBreaker(type: DealBreaker) {
    onChange({ dealBreakers: value.dealBreakers.includes(type) ? value.dealBreakers.filter((item) => item !== type) : [...value.dealBreakers, type] });
  }
  return (
    <section className="form-section final-card">
      <p className="eyebrow">FINAL DECISION</p><h2>마지막으로 마음을 정리해요.</h2>
      <div className="final-rating"><div><h3>전체 만족도</h3><span>{value.overallSatisfaction == null ? "미평가" : `${value.overallSatisfaction.toFixed(1)} / 5`}</span></div><RatingInput value={value.overallSatisfaction} onChange={(overallSatisfaction) => onChange({ overallSatisfaction })} /><textarea rows={3} value={value.overallSatisfactionReason} placeholder="전체 점수를 이렇게 준 가장 큰 이유는 무엇인가요?" onChange={(event) => onChange({ overallSatisfactionReason: event.target.value })} /></div>
      <div className="final-rating"><div><h3>가격 만족도</h3><span>{value.priceSatisfaction == null ? "미평가" : `${value.priceSatisfaction.toFixed(1)} / 5`}</span></div><RatingInput value={value.priceSatisfaction} onChange={(priceSatisfaction) => onChange({ priceSatisfaction })} /><textarea rows={2} value={value.priceSatisfactionReason} placeholder="가격 대비 어떤 점이 좋거나 아쉬웠나요?" onChange={(event) => onChange({ priceSatisfactionReason: event.target.value })} /></div>
      <div className="intent-grid"><label>상담 받을 의향<select value={value.consultationIntent} onChange={(event) => onChange({ consultationIntent: event.target.value as FinalAssessment["consultationIntent"] })}><option value="YES">있음</option><option value="MAYBE">고민</option><option value="NO">없음</option></select></label><label>계약 의향<select value={value.contractIntent} onChange={(event) => onChange({ contractIntent: event.target.value as ContractIntent })}>{Object.entries(contractLabel).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label></div>
      <div className="deal-breakers"><p>Deal Breaker <small>복수 선택 가능</small></p><div><button className={value.dealBreakers.length === 0 ? "selected" : ""} onClick={() => onChange({ dealBreakers: [] })}>없음</button>{Object.entries(dealBreakerLabel).map(([type, label]) => <button className={value.dealBreakers.includes(type as DealBreaker) ? "selected" : ""} onClick={() => toggleDealBreaker(type as DealBreaker)} key={type}>{label}</button>)}</div>{value.dealBreakers.includes("OTHER") && <input value={value.dealBreakerNote} placeholder="기타 사유" onChange={(event) => onChange({ dealBreakerNote: event.target.value })} />}</div>
      <label>좋았던 점<textarea rows={3} value={value.pros} placeholder="계속 생각나는 장점을 적어주세요." onChange={(event) => onChange({ pros: event.target.value })} /></label>
      <label>아쉬운 점<textarea rows={3} value={value.cons} placeholder="계약 전에 꼭 확인할 부분은 무엇인가요?" onChange={(event) => onChange({ cons: event.target.value })} /></label>
      <label>한줄 총평<input value={value.summary} placeholder="예: 가격만 맞으면 바로 계약하고 싶은 홀" onChange={(event) => onChange({ summary: event.target.value })} /></label>
      <label>상세 총평<textarea rows={4} value={value.detail} placeholder="집에 가서 기억하고 싶은 내용을 자유롭게 적어주세요." onChange={(event) => onChange({ detail: event.target.value })} /></label>
    </section>
  );
}

function VisitCard({ visit }: { visit: VenueVisit }) {
  const score = fulfillment(visit.checklistItems);
  const average = sectionAverage(visit.evaluations);
  return <article className="visit-card"><div className="visit-card-top"><div><small>{visit.visitDate} · {visit.visitTime}</small><h3>{visit.finalAssessment.summary || "암행투어 기록"}</h3></div><b>{visit.finalAssessment.overallSatisfaction?.toFixed(1) ?? "–"}<i>/5</i></b></div><div className="visit-stats three"><span>조건 충족도<strong>{score.percent == null ? "–" : `${score.percent}%`}</strong></span><span>Section 평균<strong>{average == null ? "–" : average.toFixed(1)}</strong></span><span>예상 비용<strong>{money(estimate(visit.price))}</strong></span></div>{visit.finalAssessment.overallSatisfactionReason && <p className="reason-note">평가 이유 · {visit.finalAssessment.overallSatisfactionReason}</p>}{visit.finalAssessment.pros && <p className="positive">좋았던 점 · {visit.finalAssessment.pros}</p>}{visit.finalAssessment.cons && <p className="negative">아쉬운 점 · {visit.finalAssessment.cons}</p>}</article>;
}

function CompareCard({ venue, visit }: { venue: Venue; visit: VenueVisit | null }) {
  if (!visit) return <article className="compare-card"><span className="status-badge">{candidateLabel[venue.candidateStatus]}</span><h2>{venue.name}</h2><Empty text="완료된 방문 기록이 없어요." /></article>;
  const conditionScore = fulfillment(visit.checklistItems);
  const average = sectionAverage(visit.evaluations);
  return (
    <article className="compare-card">
      <span className="status-badge">{candidateLabel[venue.candidateStatus]}</span><h2>{venue.name}</h2>
      <div className="compare-summary"><div><b>{visit.finalAssessment.overallSatisfaction?.toFixed(1) ?? "–"}</b><span>전체 만족도</span></div><div><b>{conditionScore.percent == null ? "–" : `${conditionScore.percent}%`}</b><span>조건 충족도</span></div><div><b>{average?.toFixed(1) ?? "–"}</b><span>Section 평균</span></div></div>
      <dl className="decision-list"><div><dt>예상 비용</dt><dd>{money(estimate(visit.price))}</dd></div><div><dt>계약 의향</dt><dd>{contractLabel[visit.finalAssessment.contractIntent]}</dd></div><div><dt>Deal Breaker</dt><dd>{visit.finalAssessment.dealBreakers.length ? visit.finalAssessment.dealBreakers.map((item) => dealBreakerLabel[item]).join(", ") : "없음"}</dd></div></dl>
      <section className="compare-section"><h3>Section 만족도</h3>{visit.evaluations.map((evaluation) => <details key={evaluation.category}><summary><span>{sectionLabel[evaluation.category]}</span><b>{evaluation.rating?.toFixed(1) ?? "–"}</b></summary><p>{evaluation.reason || "평가 이유가 없어요."}</p></details>)}</section>
      <section className="compare-section"><h3>주요 실제 조건</h3>{keyFactCodes.map((code) => { const item = visit.checklistItems.find((candidate) => candidate.itemCode === code); return item ? <div className="fact-row" key={code}><span>{item.itemName}</span><b>{answerLabel(item)}</b></div> : null; })}</section>
      {visit.finalAssessment.summary && <p className="compare-quote">“{visit.finalAssessment.summary}”</p>}
    </article>
  );
}

function ModuleHeader({ onHome, onExport }: { onHome: () => void; onExport: () => void }) {
  return <header className="app-header"><button className="module-title" onClick={onHome}><small>VENUE</small><span>웨딩홀 투어</span></button><nav><button onClick={onExport}>내 기록 백업</button></nav></header>;
}

function Toast({ text }: { text: string }) { return <div className="toast" role="status">✓ {text}</div>; }
function Empty({ text }: { text: string }) { return <div className="empty-state"><i>✦</i><p>{text}</p></div>; }
