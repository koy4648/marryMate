import type { ChecklistItem, EvaluationCategory, VenueEvaluation } from "../lib/types";

type CatalogItem = Pick<ChecklistItem, "itemCode" | "itemName" | "inputType" | "unit" | "options" | "condition">;

export type TourSection = {
  category: EvaluationCategory;
  label: string;
  satisfactionLabel: string;
  description: string;
  items: CatalogItem[];
};

const select = (...labels: string[]) => labels.map((label) => ({ value: label, label }));
const yes = (successLabel: string) => ({ operator: "EQUALS" as const, expectedValue: true, successLabel });
const atLeast = (value: number, successLabel: string) => ({ operator: "GREATER_THAN_OR_EQUAL" as const, expectedValue: value, successLabel });
const equals = (value: string, successLabel: string) => ({ operator: "EQUALS" as const, expectedValue: value, successLabel });

export const tourSections: TourSection[] = [
  {
    category: "ACCESSIBILITY",
    label: "도착 & 교통",
    satisfactionLabel: "접근성 만족도",
    description: "역에서 홀까지 실제 하객의 입장으로 확인해요.",
    items: [
      { itemCode: "ACCESS_NEAREST_STATION", itemName: "가장 가까운 지하철역", inputType: "TEXT" },
      { itemCode: "ACCESS_WALK_MINUTES", itemName: "역에서 실제 도보 시간", inputType: "NUMBER", unit: "분" },
      { itemCode: "ACCESS_WITHIN_5_MINUTES", itemName: "도보 5분 이내", inputType: "BOOLEAN", condition: yes("5분 이내 충족") },
      { itemCode: "ACCESS_SHUTTLE", itemName: "셔틀 운영", inputType: "BOOLEAN" },
      { itemCode: "ACCESS_SHUTTLE_LOCATION", itemName: "셔틀 위치", inputType: "TEXT" },
      { itemCode: "ACCESS_SIGNAGE", itemName: "웨딩홀 안내 표지판", inputType: "SINGLE_SELECT", options: select("잘 보임", "보통", "부족") },
      { itemCode: "ACCESS_EASY_TO_FIND", itemName: "건물 찾기 쉬움", inputType: "SINGLE_SELECT", options: select("쉬움", "보통", "어려움") },
      { itemCode: "ACCESS_REGIONAL_GUESTS", itemName: "지방 하객 접근성", inputType: "SINGLE_SELECT", options: select("좋음", "보통", "아쉬움") },
      { itemCode: "ACCESS_CHARTER_DROP", itemName: "대절버스 하차 위치", inputType: "TEXT" },
    ],
  },
  {
    category: "PARKING",
    label: "주차",
    satisfactionLabel: "주차 만족도",
    description: "주차장 크기보다 실제 진입과 출차까지 살펴봐요.",
    items: [
      { itemCode: "PARKING_PARENTS", itemName: "혼주 전용 주차구역", inputType: "BOOLEAN" },
      { itemCode: "PARKING_COUPLE", itemName: "신랑신부 전용 주차구역", inputType: "BOOLEAN" },
      { itemCode: "PARKING_FREE_MINUTES", itemName: "하객 무료 주차 시간", inputType: "NUMBER", unit: "분", condition: atLeast(120, "2시간 이상 충족") },
      { itemCode: "PARKING_ENTRY_TRAFFIC", itemName: "피크타임 진입로 정체", inputType: "SINGLE_SELECT", options: select("없음", "보통", "심함") },
      { itemCode: "PARKING_CAPACITY", itemName: "주차 공간", inputType: "SINGLE_SELECT", options: select("여유", "보통", "부족") },
      { itemCode: "PARKING_FULL", itemName: "만차 여부", inputType: "BOOLEAN" },
      { itemCode: "PARKING_ALTERNATIVE", itemName: "만차 시 대체 주차장", inputType: "TEXT" },
      { itemCode: "PARKING_GUIDES", itemName: "안내요원 배치", inputType: "BOOLEAN" },
      { itemCode: "PARKING_GUIDE_CONTROL", itemName: "안내요원 통제력", inputType: "SINGLE_SELECT", options: select("좋음", "보통", "아쉬움") },
      { itemCode: "PARKING_EXIT_TRAFFIC", itemName: "출차 혼잡", inputType: "SINGLE_SELECT", options: select("없음", "보통", "심함") },
      { itemCode: "PARKING_CHARTER_BUS", itemName: "대절버스 주차 가능", inputType: "BOOLEAN", condition: yes("대절버스 주차 가능") },
    ],
  },
  {
    category: "BRIDAL_WAITING_ROOM",
    label: "신부대기실",
    satisfactionLabel: "신부대기실 만족도",
    description: "사진뿐 아니라 실제 공간과 신부 동선을 확인해요.",
    items: [
      { itemCode: "BRIDAL_DESIGN", itemName: "신부대기실 디자인", inputType: "SINGLE_SELECT", options: select("매우 좋음", "좋음", "보통", "아쉬움") },
      { itemCode: "BRIDAL_SIZE", itemName: "실제 크기", inputType: "SINGLE_SELECT", options: select("여유", "보통", "좁음") },
      { itemCode: "BRIDAL_DAYLIGHT", itemName: "채광", inputType: "SINGLE_SELECT", options: select("좋음", "보통", "어두움") },
      { itemCode: "BRIDAL_PHOTO", itemName: "사진 촬영 환경", inputType: "SINGLE_SELECT", options: select("좋음", "보통", "아쉬움") },
      { itemCode: "BRIDAL_SECRET_ROUTE", itemName: "홀 직행 비밀 동선", inputType: "BOOLEAN", condition: yes("비밀 동선 있음") },
      { itemCode: "BRIDAL_SEPARATE_FLOW", itemName: "일반 하객과 동선 분리", inputType: "BOOLEAN" },
      { itemCode: "BRIDAL_PRIVATE_RESTROOM", itemName: "신부 전용 화장실", inputType: "BOOLEAN", condition: yes("전용 화장실 있음") },
      { itemCode: "BRIDAL_SECONDARY_ROOM", itemName: "보조 대기실", inputType: "BOOLEAN" },
      { itemCode: "BRIDAL_EARLY_WAIT", itemName: "조기 도착 시 대기 공간", inputType: "BOOLEAN" },
      { itemCode: "BRIDAL_MAKEUP", itemName: "메이크업 수정 공간", inputType: "BOOLEAN" },
      { itemCode: "BRIDAL_STORAGE", itemName: "짐 보관 공간", inputType: "BOOLEAN" },
    ],
  },
  {
    category: "HALL",
    label: "홀 내부",
    satisfactionLabel: "홀 만족도",
    description: "가장 앞자리부터 뒷자리까지 직접 이동하며 확인해요.",
    items: [
      { itemCode: "HALL_DESIGN", itemName: "홀 디자인", inputType: "SINGLE_SELECT", options: select("매우 좋음", "좋음", "보통", "아쉬움") },
      { itemCode: "HALL_FLOWERS", itemName: "꽃장식", inputType: "SINGLE_SELECT", options: select("풍성함", "보통", "아쉬움") },
      { itemCode: "HALL_CEILING", itemName: "천장 높이", inputType: "SINGLE_SELECT", options: select("높음", "보통", "낮음") },
      { itemCode: "HALL_AISLE_LENGTH", itemName: "버진로드 길이", inputType: "NUMBER", unit: "m" },
      { itemCode: "HALL_AISLE_WIDTH", itemName: "버진로드 폭", inputType: "SINGLE_SELECT", options: select("넓음", "보통", "좁음") },
      { itemCode: "HALL_AISLE_HEIGHT", itemName: "버진로드 높이감", inputType: "SINGLE_SELECT", options: select("단차 있음", "낮은 단차", "평지") },
      { itemCode: "HALL_COLUMNS", itemName: "내부 기둥", inputType: "BOOLEAN" },
      { itemCode: "HALL_VIEW_OBSTRUCTION", itemName: "하객 시야 방해 요소", inputType: "BOOLEAN" },
      { itemCode: "HALL_BACK_VIEW", itemName: "뒤쪽 좌석 시야", inputType: "SINGLE_SELECT", options: select("좋음", "보통", "아쉬움") },
      { itemCode: "HALL_SEAT_SPACING", itemName: "좌석 간격", inputType: "SINGLE_SELECT", options: select("여유", "보통", "좁음") },
      { itemCode: "HALL_CAPACITY_FEEL", itemName: "실제 수용감", inputType: "SINGLE_SELECT", options: select("여유", "적정", "혼잡") },
      { itemCode: "HALL_ENTRANCE_LIGHT", itemName: "입장 조명", inputType: "SINGLE_SELECT", options: select("좋음", "보통", "아쉬움") },
      { itemCode: "HALL_LIGHT_TRACKING", itemName: "조명 추적 안정성", inputType: "SINGLE_SELECT", options: select("안정적", "보통", "불안정") },
    ],
  },
  {
    category: "CEREMONY_OPERATION",
    label: "본식 운영",
    satisfactionLabel: "예식 운영 만족도",
    description: "실제 예식의 속도, 음향과 스태프 대응을 관찰해요.",
    items: [
      { itemCode: "OPERATION_INTERVAL", itemName: "실제 예식 간격", inputType: "NUMBER", unit: "분", condition: atLeast(90, "90분 이상 충족") },
      { itemCode: "OPERATION_FLOW_OVERLAP", itemName: "앞뒤 타임 동선 겹침", inputType: "BOOLEAN" },
      { itemCode: "OPERATION_DURATION", itemName: "실제 본식 시간", inputType: "NUMBER", unit: "분" },
      { itemCode: "OPERATION_NO_MIC_NOISE", itemName: "마이크 잡음 없음", inputType: "BOOLEAN", condition: yes("마이크 잡음 없음") },
      { itemCode: "OPERATION_MC_CLARITY", itemName: "사회자 멘트 전달력", inputType: "SINGLE_SELECT", options: select("좋음", "보통", "아쉬움") },
      { itemCode: "OPERATION_ECHO", itemName: "음향 울림", inputType: "SINGLE_SELECT", options: select("없음", "보통", "심함") },
      { itemCode: "OPERATION_SONG_SOUND", itemName: "축가 음질", inputType: "SINGLE_SELECT", options: select("좋음", "보통", "아쉬움") },
      { itemCode: "OPERATION_FLOWER_SHOWER", itemName: "플라워 샤워 제공", inputType: "BOOLEAN" },
      { itemCode: "OPERATION_FLOWER_METHOD", itemName: "플라워 샤워 방식", inputType: "SINGLE_SELECT", options: select("자동", "수동", "미제공") },
      { itemCode: "OPERATION_FLOWER_EXTRA", itemName: "플라워 샤워 추가 비용", inputType: "BOOLEAN" },
      { itemCode: "OPERATION_STAFF_SKILL", itemName: "현장 스태프 숙련도", inputType: "SINGLE_SELECT", options: select("좋음", "보통", "아쉬움") },
      { itemCode: "OPERATION_TIMING", itemName: "진행 타이밍", inputType: "SINGLE_SELECT", options: select("매끄러움", "보통", "어수선함") },
      { itemCode: "OPERATION_INCIDENT", itemName: "돌발 상황 대응", inputType: "TEXT" },
    ],
  },
  {
    category: "GUEST_FLOW",
    label: "로비 & 하객 동선",
    satisfactionLabel: "하객 동선 만족도",
    description: "예식 전후 하객이 가장 붐비는 순간을 확인해요.",
    items: [
      { itemCode: "FLOW_LOBBY_SIZE", itemName: "로비 크기", inputType: "SINGLE_SELECT", options: select("여유", "보통", "좁음") },
      { itemCode: "FLOW_PEAK_CROWD", itemName: "피크타임 혼잡도", inputType: "SINGLE_SELECT", options: select("여유", "보통", "혼잡") },
      { itemCode: "FLOW_GIFT_DESK", itemName: "앞뒤 예식 축의대 동선", inputType: "SINGLE_SELECT", options: select("완전 분리", "일부 분리", "겹침"), condition: equals("완전 분리", "축의대 완전 분리") },
      { itemCode: "FLOW_WRONG_DESK_RISK", itemName: "다른 예식 축의대로 갈 가능성", inputType: "SINGLE_SELECT", options: select("낮음", "보통", "높음") },
      { itemCode: "FLOW_ELEVATOR_COUNT", itemName: "엘리베이터 대수", inputType: "NUMBER", unit: "대" },
      { itemCode: "FLOW_ELEVATOR_WAIT", itemName: "엘리베이터 대기 줄", inputType: "SINGLE_SELECT", options: select("짧음", "보통", "김") },
      { itemCode: "FLOW_ALTERNATIVE_ROUTE", itemName: "에스컬레이터·계단 대체 동선", inputType: "BOOLEAN" },
      { itemCode: "FLOW_BANQUET_ROUTE", itemName: "연회장 이동 동선", inputType: "SINGLE_SELECT", options: select("쉬움", "보통", "복잡") },
      { itemCode: "FLOW_GIFT_DESK_SIZE", itemName: "축의대 공간 크기", inputType: "SINGLE_SELECT", options: select("여유", "보통", "좁음") },
    ],
  },
  {
    category: "BANQUET",
    label: "연회장 / 식사",
    satisfactionLabel: "연회장·식사 만족도",
    description: "직접 확인하지 못했다면 부담 없이 미평가로 남겨요.",
    items: [
      { itemCode: "BANQUET_DISTANCE", itemName: "연회장까지 이동 거리", inputType: "SINGLE_SELECT", options: select("가까움", "보통", "멂") },
      { itemCode: "BANQUET_SHARED", itemName: "다른 예식 하객과 공간 공유", inputType: "BOOLEAN" },
      { itemCode: "BANQUET_TABLE_SPACING", itemName: "테이블 간격", inputType: "SINGLE_SELECT", options: select("여유", "보통", "좁음") },
      { itemCode: "BANQUET_SEATS", itemName: "좌석 수", inputType: "NUMBER", unit: "석" },
      { itemCode: "BANQUET_CROWD", itemName: "혼잡도", inputType: "SINGLE_SELECT", options: select("여유", "보통", "혼잡") },
      { itemCode: "BANQUET_VARIETY", itemName: "음식 종류", inputType: "SINGLE_SELECT", options: select("다양함", "보통", "적음") },
      { itemCode: "BANQUET_CONDITION", itemName: "음식 상태", inputType: "SINGLE_SELECT", options: select("좋음", "보통", "아쉬움") },
      { itemCode: "BANQUET_TEMPERATURE", itemName: "음식 온도", inputType: "SINGLE_SELECT", options: select("적정", "보통", "아쉬움") },
      { itemCode: "BANQUET_REFILL", itemName: "리필 속도", inputType: "SINGLE_SELECT", options: select("빠름", "보통", "느림") },
      { itemCode: "BANQUET_STAFF", itemName: "직원 응대", inputType: "SINGLE_SELECT", options: select("좋음", "보통", "아쉬움") },
      { itemCode: "BANQUET_PARENTS_SPACE", itemName: "혼주 식사 공간", inputType: "BOOLEAN" },
    ],
  },
  {
    category: "AMENITIES",
    label: "부대시설",
    satisfactionLabel: "하객 편의시설 만족도",
    description: "하객이 실제로 찾게 되는 시설을 빠르게 확인해요.",
    items: [
      { itemCode: "AMENITIES_ATM", itemName: "ATM 있음", inputType: "BOOLEAN", condition: yes("ATM 있음") },
      { itemCode: "AMENITIES_ATM_LOCATION", itemName: "ATM 위치", inputType: "TEXT" },
      { itemCode: "AMENITIES_RESTROOM_LOCATION", itemName: "화장실 위치", inputType: "TEXT" },
      { itemCode: "AMENITIES_WOMEN_STALLS", itemName: "여자 화장실 칸 수", inputType: "NUMBER", unit: "칸" },
      { itemCode: "AMENITIES_CLEANLINESS", itemName: "화장실 청결", inputType: "SINGLE_SELECT", options: select("깨끗함", "보통", "아쉬움") },
      { itemCode: "AMENITIES_CROWD", itemName: "화장실 혼잡", inputType: "SINGLE_SELECT", options: select("여유", "보통", "혼잡") },
      { itemCode: "AMENITIES_NURSING", itemName: "수유실 등 편의시설", inputType: "TEXT" },
      { itemCode: "AMENITIES_BUILDING_CLEAN", itemName: "건물 전체 청결", inputType: "SINGLE_SELECT", options: select("깨끗함", "보통", "아쉬움") },
    ],
  },
];

export const sectionLabel = Object.fromEntries(tourSections.map((section) => [section.category, section.label])) as Record<EvaluationCategory, string>;

export const keyFactCodes = [
  "OPERATION_INTERVAL",
  "PARKING_FREE_MINUTES",
  "BRIDAL_SECRET_ROUTE",
  "BRIDAL_PRIVATE_RESTROOM",
  "FLOW_GIFT_DESK",
  "PARKING_CHARTER_BUS",
  "AMENITIES_ATM",
  "FLOW_ELEVATOR_COUNT",
] as const;

export function buildChecklist(makeId: () => string): ChecklistItem[] {
  let sortOrder = 0;
  return tourSections.flatMap((section) => section.items.map((item) => ({
    id: makeId(),
    checklistType: "SECRET_TOUR" as const,
    section: section.category,
    observationStatus: "UNANSWERED" as const,
    answer: null,
    note: "",
    sortOrder: sortOrder++,
    ...item,
  })));
}

export function buildEvaluations(makeId: () => string): VenueEvaluation[] {
  return tourSections.map((section, sortOrder) => ({
    id: makeId(),
    category: section.category,
    status: "UNRATED",
    rating: null,
    reason: "",
    sortOrder,
  }));
}
