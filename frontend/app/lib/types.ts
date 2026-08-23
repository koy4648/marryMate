export type CandidateStatus = "INTERESTED" | "PLANNED" | "SHORTLISTED" | "ON_HOLD" | "REJECTED" | "CONTRACTED";
export type EvaluationStatus = "UNRATED" | "RATED" | "NOT_OBSERVED";
export type ObservationStatus = "UNANSWERED" | "OBSERVED" | "NOT_OBSERVED" | "NOT_APPLICABLE";
export type ChecklistInputType = "BOOLEAN" | "NUMBER" | "TEXT" | "SINGLE_SELECT";
export type EvaluationCategory =
  | "ACCESSIBILITY"
  | "PARKING"
  | "BRIDAL_WAITING_ROOM"
  | "HALL"
  | "CEREMONY_OPERATION"
  | "GUEST_FLOW"
  | "BANQUET"
  | "AMENITIES";
export type ContractIntent = "STRONG_CANDIDATE" | "CONSIDERING" | "ON_HOLD" | "REJECT";
export type YesMaybeNo = "YES" | "MAYBE" | "NO";
export type DealBreaker =
  | "PRICE"
  | "CAPACITY"
  | "CEREMONY_INTERVAL"
  | "ACCESSIBILITY"
  | "PARKING"
  | "GUEST_FLOW"
  | "BRIDAL_WAITING_ROOM"
  | "BANQUET"
  | "OTHER";

export type Venue = {
  id: string;
  name: string;
  address: string;
  candidateStatus: CandidateStatus;
  createdAt: string;
};

export type VenuePrice = {
  baseAndMandatoryAmount: number | null;
  pricePerGuest: number | null;
  guaranteedGuestCount: number | null;
  expectedGuestCount: number | null;
  additionalAmount: number | null;
  discountAmount: number | null;
};

export type VenueEvaluation = {
  id: string;
  category: EvaluationCategory;
  status: EvaluationStatus;
  rating: number | null;
  reason: string;
  sortOrder: number;
};

export type ChecklistCondition = {
  operator: "EQUALS" | "GREATER_THAN_OR_EQUAL";
  expectedValue: boolean | number | string;
  successLabel: string;
};

export type ChecklistItem = {
  id: string;
  checklistType: "SECRET_TOUR" | "CONSULTATION";
  itemCode: string;
  section: EvaluationCategory;
  itemName: string;
  inputType: ChecklistInputType;
  unit?: string;
  options?: Array<{ value: string; label: string }>;
  observationStatus: ObservationStatus;
  answer: boolean | number | string | null;
  note: string;
  condition?: ChecklistCondition;
  sortOrder: number;
};

export type FinalAssessment = {
  overallSatisfaction: number | null;
  overallSatisfactionReason: string;
  priceSatisfaction: number | null;
  priceSatisfactionReason: string;
  consultationIntent: YesMaybeNo;
  contractIntent: ContractIntent;
  revisitIntent: "HIGH" | "MEDIUM" | "LOW" | "NONE";
  pros: string;
  cons: string;
  summary: string;
  detail: string;
  dealBreakers: DealBreaker[];
  dealBreakerNote: string;
};

export type VenueVisit = {
  id: string;
  venueId: string;
  visitType: "SECRET_TOUR" | "CONSULTATION";
  visitDate: string;
  visitTime: string;
  priceSource: "UNKNOWN" | "ONLINE" | "ACQUAINTANCE" | "CONSULTATION_QUOTE" | "CONTRACT_QUOTE";
  price: VenuePrice;
  evaluations: VenueEvaluation[];
  checklistItems: ChecklistItem[];
  finalAssessment: FinalAssessment;
  resultingCandidateStatus: CandidateStatus;
  completed: boolean;
  savedAt: string;
};

export type CreateVenuePlanRequest = {
  venueName: string;
  address: string;
  candidateStatus: CandidateStatus;
};

export type CreateVenueVisitRequest = Omit<VenueVisit, "id" | "venueId" | "savedAt">;

export type VenuePlanResponse = {
  id: number;
  venue: { id: number; name: string; address: string | null };
  candidateStatus: CandidateStatus;
  createdAt: string;
};

export type LocalDatabase = {
  schemaVersion: 2;
  venues: Venue[];
  visits: VenueVisit[];
};

export type AuthSession = {
  token: string;
  user: { id: number; email: string; nickname: string };
  workspaceId: number | null;
};

export type Workspace = { id: number; name: string; role: "OWNER" | "MEMBER" };
