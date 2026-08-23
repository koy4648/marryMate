import type {
  ChecklistItem,
  FinalAssessment,
  LocalDatabase,
  VenueEvaluation,
  VenuePrice,
  VenueVisit,
} from "../lib/types";
import { buildChecklist, buildEvaluations, sectionLabel } from "./catalog";

export const makeId = () => typeof crypto !== "undefined" && crypto.randomUUID
  ? crypto.randomUUID()
  : `${Date.now()}-${Math.random()}`;

export const today = () => new Date().toISOString().slice(0, 10);
export const nowTime = () => new Date().toTimeString().slice(0, 5);

export const emptyPrice = (): VenuePrice => ({
  baseAndMandatoryAmount: null,
  pricePerGuest: null,
  guaranteedGuestCount: null,
  expectedGuestCount: null,
  additionalAmount: 0,
  discountAmount: 0,
});

export const emptyFinalAssessment = (): FinalAssessment => ({
  overallSatisfaction: null,
  overallSatisfactionReason: "",
  priceSatisfaction: null,
  priceSatisfactionReason: "",
  consultationIntent: "MAYBE",
  contractIntent: "CONSIDERING",
  revisitIntent: "MEDIUM",
  pros: "",
  cons: "",
  summary: "",
  detail: "",
  dealBreakers: [],
  dealBreakerNote: "",
});

export function newVisit(venueId: string): VenueVisit {
  return {
    id: makeId(),
    venueId,
    visitType: "SECRET_TOUR",
    visitDate: today(),
    visitTime: nowTime(),
    priceSource: "UNKNOWN",
    price: emptyPrice(),
    evaluations: buildEvaluations(makeId),
    checklistItems: buildChecklist(makeId),
    finalAssessment: emptyFinalAssessment(),
    resultingCandidateStatus: "INTERESTED",
    completed: false,
    savedAt: new Date().toISOString(),
  };
}

export function sectionAverage(evaluations: VenueEvaluation[]) {
  const rated = evaluations.filter((item) => item.status === "RATED" && item.rating != null);
  if (!rated.length) return null;
  return rated.reduce((sum, item) => sum + (item.rating ?? 0), 0) / rated.length;
}

function conditionMet(item: ChecklistItem) {
  if (item.observationStatus !== "OBSERVED" || item.answer == null || !item.condition) return null;
  if (item.condition.operator === "GREATER_THAN_OR_EQUAL") {
    return typeof item.answer === "number" && typeof item.condition.expectedValue === "number"
      ? item.answer >= item.condition.expectedValue
      : null;
  }
  return item.answer === item.condition.expectedValue;
}

export function fulfillment(items: ChecklistItem[]) {
  let met = 0;
  let unmet = 0;
  let unknown = 0;
  items.filter((item) => item.condition).forEach((item) => {
    const result = conditionMet(item);
    if (result === true) met += 1;
    else if (result === false) unmet += 1;
    else unknown += 1;
  });
  const evaluated = met + unmet;
  return { met, unmet, unknown, evaluated, percent: evaluated ? Math.round(met / evaluated * 100) : null };
}

export function itemConditionMet(item: ChecklistItem) {
  return conditionMet(item);
}

export function estimate(price: VenuePrice) {
  const guests = [price.guaranteedGuestCount, price.expectedGuestCount].filter((value): value is number => value != null);
  if (price.baseAndMandatoryAmount == null || price.pricePerGuest == null || guests.length === 0 || price.additionalAmount == null || price.discountAmount == null) return null;
  return price.baseAndMandatoryAmount + Math.max(...guests) * price.pricePerGuest + price.additionalAmount - price.discountAmount;
}

export function money(value: number | null) {
  return value == null ? "미입력" : `${value.toLocaleString("ko-KR")}원`;
}

export function answerLabel(item: ChecklistItem) {
  if (item.observationStatus === "NOT_OBSERVED") return "미확인";
  if (item.observationStatus === "NOT_APPLICABLE") return "해당 없음";
  if (item.observationStatus !== "OBSERVED" || item.answer == null || item.answer === "") return "–";
  if (typeof item.answer === "boolean") return item.answer ? "예" : "아니오";
  return `${item.answer}${item.unit ?? ""}`;
}

type LegacyEvaluation = {
  category?: string;
  status?: string;
  rating?: number | null;
  reason?: string;
};

type LegacyVisit = {
  id?: string;
  venueId?: string;
  visitType?: "SECRET_TOUR" | "CONSULTATION";
  visitDate?: string;
  visitTime?: string;
  priceSource?: VenueVisit["priceSource"];
  price?: Partial<VenuePrice>;
  evaluations?: LegacyEvaluation[];
  pros?: string;
  cons?: string;
  summary?: string;
  detail?: string;
  revisitIntent?: FinalAssessment["revisitIntent"];
  resultingCandidateStatus?: VenueVisit["resultingCandidateStatus"];
  completed?: boolean;
  savedAt?: string;
};

type LegacyDatabase = {
  schemaVersion?: number;
  venues?: LocalDatabase["venues"];
  visits?: LegacyVisit[];
};

const legacyCategoryMap: Record<string, VenueEvaluation["category"] | undefined> = {
  ACCESSIBILITY: "ACCESSIBILITY",
  PARKING: "PARKING",
  BRIDAL_WAITING_ROOM: "BRIDAL_WAITING_ROOM",
  HALL: "HALL",
  OPERATION: "CEREMONY_OPERATION",
  GUEST_FLOW: "GUEST_FLOW",
  BANQUET: "BANQUET",
};

function migrateVisit(legacy: LegacyVisit): VenueVisit | null {
  if (!legacy.venueId) return null;
  const migrated = newVisit(legacy.venueId);
  const oldEvaluations = legacy.evaluations ?? [];
  migrated.evaluations = migrated.evaluations.map((evaluation) => {
    const matches = oldEvaluations.filter((old) => legacyCategoryMap[old.category ?? ""] === evaluation.category && old.status === "RATED" && old.rating != null);
    if (!matches.length) return evaluation;
    const rating = matches.reduce((sum, item) => sum + (item.rating ?? 0), 0) / matches.length;
    return {
      ...evaluation,
      status: "RATED",
      rating: Math.round(rating * 2) / 2,
      reason: matches.map((item) => item.reason?.trim()).filter(Boolean).join(" · "),
    };
  });
  const priceRatings = oldEvaluations.filter((item) => item.category === "PRICE" && item.status === "RATED" && item.rating != null);
  migrated.finalAssessment = {
    ...migrated.finalAssessment,
    priceSatisfaction: priceRatings.length ? Math.round((priceRatings.reduce((sum, item) => sum + (item.rating ?? 0), 0) / priceRatings.length) * 2) / 2 : null,
    pros: legacy.pros ?? "",
    cons: legacy.cons ?? "",
    summary: legacy.summary ?? "",
    detail: legacy.detail ?? "",
    revisitIntent: legacy.revisitIntent ?? "MEDIUM",
  };
  return {
    ...migrated,
    id: legacy.id ?? migrated.id,
    visitType: legacy.visitType ?? "SECRET_TOUR",
    visitDate: legacy.visitDate ?? migrated.visitDate,
    visitTime: legacy.visitTime ?? migrated.visitTime,
    priceSource: legacy.priceSource ?? "UNKNOWN",
    price: { ...migrated.price, ...legacy.price },
    resultingCandidateStatus: legacy.resultingCandidateStatus ?? "INTERESTED",
    completed: legacy.completed ?? false,
    savedAt: legacy.savedAt ?? migrated.savedAt,
  };
}

export function parseDatabase(raw: string | null): { database: LocalDatabase; migrated: boolean } {
  if (!raw) return { database: { schemaVersion: 2, venues: [], visits: [] }, migrated: false };
  const parsed = JSON.parse(raw) as LegacyDatabase;
  if (parsed.schemaVersion === 2) return { database: parsed as LocalDatabase, migrated: false };
  return {
    database: {
      schemaVersion: 2,
      venues: parsed.venues ?? [],
      visits: (parsed.visits ?? []).map(migrateVisit).filter((visit): visit is VenueVisit => visit != null),
    },
    migrated: true,
  };
}

export function progressOf(visit: VenueVisit) {
  const checklistDone = visit.checklistItems.filter((item) => item.observationStatus !== "UNANSWERED").length;
  const evaluationDone = visit.evaluations.filter((item) => item.status !== "UNRATED").length;
  const total = visit.checklistItems.length + visit.evaluations.length + 1;
  const done = checklistDone + evaluationDone + (visit.finalAssessment.overallSatisfaction == null ? 0 : 1);
  return { done, total, percent: total ? Math.round(done / total * 100) : 0 };
}

export function sectionTitle(category: VenueEvaluation["category"]) {
  return sectionLabel[category];
}
