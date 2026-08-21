export type CandidateStatus = "INTERESTED" | "PLANNED" | "SHORTLISTED" | "ON_HOLD" | "REJECTED" | "CONTRACTED";
export type EvaluationStatus = "UNRATED" | "RATED" | "NOT_OBSERVED";
export type ChecklistStatus = "UNCHECKED" | "CHECKED" | "NOT_APPLICABLE";
export type EvaluationCategory = "HALL" | "BRIDAL_WAITING_ROOM" | "ACCESSIBILITY" | "PARKING" | "GUEST_FLOW" | "BANQUET" | "OPERATION" | "PRICE";

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
  itemName: string;
  status: EvaluationStatus;
  rating: number | null;
  reason: string;
  sortOrder: number;
};

export type ChecklistItem = {
  id: string;
  checklistType: "SECRET_TOUR" | "CONSULTATION";
  section: string;
  itemName: string;
  status: ChecklistStatus;
  note: string;
  sortOrder: number;
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
  pros: string;
  cons: string;
  summary: string;
  detail: string;
  revisitIntent: "HIGH" | "MEDIUM" | "LOW" | "NONE";
  resultingCandidateStatus: CandidateStatus;
  completed: boolean;
  savedAt: string;
};

export type CreateVenueRequest = Pick<Venue, "name" | "address" | "candidateStatus">;
export type CreateVenueVisitRequest = Omit<VenueVisit, "id" | "venueId" | "savedAt">;

export type LocalDatabase = {
  venues: Venue[];
  visits: VenueVisit[];
};
