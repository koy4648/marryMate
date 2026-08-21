# Marry Mate Venue Tour Backend 구현 가이드

이 문서는 현재 Frontend 계약에 맞춰 Venue Tour Backend를 직접 구현하기 위한 순서입니다.

Frontend의 기준 파일:

- `frontend/app/lib/types.ts`: 요청·응답에 사용하는 타입
- `frontend/app/venues/catalog.ts`: 기본 Checklist Catalog와 조건
- `frontend/app/venues/domain.ts`: 조건 충족도, 평균, 가격 계산 규칙
- `frontend/app/lib/api.ts`: 연결 예정 API

## 완료 목표

아래 흐름이 Backend 데이터로 동작하면 Phase 0의 첫 번째 Backend Slice가 완료됩니다.

```text
VenuePlan 생성
→ 암행투어 Visit 전체 저장
→ Visit 상세 조회
→ 최근 완료 Visit을 기준으로 Venue 비교
```

현재는 만들지 않습니다.

- 로그인, JWT, CoupleWorkspace
- Public Review와 사진 업로드
- Point, 댓글, 신고
- DB 기반 Checklist Template 편집
- 중요도 Weight와 추천점수
- Vendor와 Quote

사진은 향후 모든 `Review`에 `ReviewMedia`로 연결합니다. Phase 0의 비공개 `VenueVisit` 저장을 위해 Media Entity를 미리 만들지 않습니다.

---

## 1단계: Spring Boot 프로젝트 생성

환경:

- Java 17
- Spring Boot 3.x
- Gradle
- MySQL 8

Dependency:

- Spring Web
- Spring Data JPA
- Validation
- MySQL Driver
- Flyway Migration
- Lombok은 선택
- Testcontainers MySQL은 테스트 단계에서 추가

Base package:

```text
com.marrymate
```

추천 구조:

```text
com.marrymate
├── common
│   ├── config
│   ├── exception
│   └── response
└── venue
    ├── api
    │   ├── VenuePlanController
    │   ├── VenueVisitController
    │   └── dto
    ├── application
    │   ├── VenuePlanService
    │   ├── VenueVisitService
    │   └── VenueComparisonService
    ├── domain
    │   ├── Venue
    │   ├── VenuePlan
    │   ├── VenueVisit
    │   ├── VenueEvaluation
    │   ├── ChecklistItem
    │   ├── VenuePrice
    │   └── calculator
    └── infrastructure
        ├── VenueJpaRepository
        ├── VenuePlanJpaRepository
        ├── VenueVisitJpaRepository
        ├── VenueEvaluationJpaRepository
        └── ChecklistItemJpaRepository
```

첫 확인:

```bash
./gradlew compileJava
./gradlew test
```

---

## 2단계: Local MySQL과 Flyway 설정

JPA의 `ddl-auto=create`에 의존하지 말고 Flyway를 사용합니다.

Local에서는 다음 원칙을 권장합니다.

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
  flyway:
    enabled: true
```

첫 Migration:

```text
src/main/resources/db/migration/V1__create_venue_tour_tables.sql
```

금액은 원 단위 `BIGINT`, 만족도는 `DECIMAL(2,1)`, 날짜와 시간은 각각 `DATE`, `TIME`을 사용합니다.

---

## 3단계: Venue와 VenuePlan 구현

두 모델을 분리하는 이유:

- `Venue`: 여러 사용자가 공유할 수 있는 웨딩홀 원본
- `VenuePlan`: 사용자 또는 커플의 후보 상태와 개인 메모

현재 로그인은 없지만 후보 상태를 `Venue`에 넣지 않습니다. CoupleWorkspace가 추가되면 `VenuePlan.workspaceId`만 추가하면 됩니다.

```text
Venue
- id
- name
- address
- websiteUrl nullable
- phone nullable
- createdAt
- updatedAt

VenuePlan
- id
- venueId
- candidateStatus
- privateMemo nullable
- createdAt
- updatedAt
```

`CandidateStatus`:

```text
INTERESTED
PLANNED
SHORTLISTED
ON_HOLD
REJECTED
CONTRACTED
```

JPA 관계:

```text
VenuePlan N:1 Venue
```

`ManyToOne(fetch = LAZY)` 단방향 관계로 시작합니다. `Venue`에 `List<VenuePlan>`을 추가하지 않습니다.

먼저 구현할 API:

```http
POST /api/v1/venue-plans
GET  /api/v1/venue-plans
GET  /api/v1/venue-plans/{planId}
PATCH /api/v1/venue-plans/{planId}
```

생성 Request:

```json
{
  "venueName": "아펠가모 공덕",
  "address": "서울특별시 마포구 ...",
  "candidateStatus": "PLANNED"
}
```

Phase 0에서는 이 요청 하나로 `Venue`와 `VenuePlan`을 함께 생성해도 됩니다. Venue 중복 병합은 Public Venue Catalog를 구현할 때 다룹니다.

완료 조건:

- 이름 blank 요청은 400
- 존재하지 않는 Plan은 404
- Entity를 직접 반환하지 않고 Response DTO 사용
- 목록 조회에서 Venue 때문에 N+1이 발생하지 않도록 Projection 또는 Fetch Join 사용

---

## 4단계: VenueVisit Aggregate Root 구현

```text
VenuePlan 1:N VenueVisit
VenueVisit 1:N VenueEvaluation
VenueVisit 1:N ChecklistItem
VenueVisit 1:N DealBreaker value
VenueVisit embeds VenuePrice
VenueVisit embeds FinalAssessment fields
```

`VenueVisit` 주요 필드:

```text
- id
- venuePlanId
- visitType
- visitDate
- visitTime
- priceSource
- resultingCandidateStatus
- completed
- createdAt
- updatedAt
```

`VisitType`:

```text
SECRET_TOUR
CONSULTATION
```

`PriceSource`:

```text
UNKNOWN
ONLINE
ACQUAINTANCE
CONSULTATION_QUOTE
CONTRACT_QUOTE
```

JPA에서는 자식이 부모를 참조하는 단방향 `ManyToOne(fetch = LAZY)`을 기본으로 합니다. 저장 편의를 위해 Aggregate 내부 컬렉션을 양방향으로 구성한다면 연관관계 편의 메서드를 한 곳에만 둡니다.

---

## 5단계: VenuePrice Embeddable

```text
VenuePrice
- baseAndMandatoryAmount
- pricePerGuest
- guaranteedGuestCount
- expectedGuestCount
- additionalAmount
- discountAmount
```

계산식:

```text
appliedGuestCount = max(guaranteedGuestCount, expectedGuestCount)
estimatedMealAmount = appliedGuestCount × pricePerGuest
finalEstimatedAmount
  = baseAndMandatoryAmount
  + estimatedMealAmount
  + additionalAmount
  - discountAmount
```

규칙:

- 입력 금액과 인원은 0 이상
- 필수 계산값이 하나라도 없으면 결과는 `null`
- 모르는 값을 임의로 0원 처리하지 않음
- 계산 결과는 DB에 저장하지 않음

`VenuePriceCalculator` 또는 값 타입 메서드로 구현하고 단위 테스트를 먼저 작성합니다.

---

## 6단계: VenueEvaluation 구현

Evaluation은 세부 Checklist 항목별 별점이 아닙니다. Section 하나당 만족도 하나를 저장합니다.

```text
VenueEvaluation
- id
- venueVisitId
- category
- status
- rating
- reason
- sortOrder
```

`EvaluationCategory`:

```text
ACCESSIBILITY
PARKING
BRIDAL_WAITING_ROOM
HALL
CEREMONY_OPERATION
GUEST_FLOW
BANQUET
AMENITIES
```

`EvaluationStatus`:

```text
UNRATED
RATED
NOT_OBSERVED
```

DB Constraint:

```text
UNIQUE (venue_visit_id, category)
```

Validation:

- `RATED`이면 rating 필수
- rating은 1.0 이상 5.0 이하
- rating은 0.5 단위
- `UNRATED`, `NOT_OBSERVED`이면 rating은 null
- reason은 선택값

Java는 `BigDecimal`, MySQL은 `DECIMAL(2,1)`을 사용합니다. `double`을 사용하지 않습니다.

Section 평균:

```text
RATED 상태 rating 합 / RATED 개수
```

`UNRATED`, `NOT_OBSERVED`는 제외합니다. 대상이 없으면 `null`입니다.

---

## 7단계: ChecklistItem 구현

Checklist는 객관적으로 관찰한 사실을 저장합니다.

```text
ChecklistItem
- id
- venueVisitId
- checklistType
- itemCode
- section
- itemNameSnapshot
- inputType
- unit
- observationStatus
- booleanAnswer
- numberAnswer
- textAnswer
- selectedOptionCode
- note
- conditionOperator nullable
- expectedBoolean nullable
- expectedNumber nullable
- expectedOptionCode nullable
- conditionSuccessLabel nullable
- sortOrder
```

`ChecklistInputType`:

```text
BOOLEAN
NUMBER
TEXT
SINGLE_SELECT
```

`ObservationStatus`:

```text
UNANSWERED
OBSERVED
NOT_OBSERVED
NOT_APPLICABLE
```

중요한 구분:

```text
셔틀이 없음을 확인:
observationStatus = OBSERVED
booleanAnswer = false

셔틀을 확인하지 못함:
observationStatus = NOT_OBSERVED
booleanAnswer = null
```

Validation:

- `OBSERVED`이면 inputType에 맞는 Answer 하나만 존재
- 나머지 타입의 Answer 컬럼은 null
- `NOT_OBSERVED`, `NOT_APPLICABLE`, `UNANSWERED`이면 모든 Answer가 null
- `itemCode`는 Visit 안에서 중복 금지

기본 Checklist는 DB Template Entity로 만들지 않습니다. `frontend/app/venues/catalog.ts`와 동일한 Catalog를 Backend 코드에 만들고 Visit 생성 시 스냅샷 Row로 복사합니다.

단, 현재 Frontend가 완성된 Item 전체를 Request로 보내므로 첫 저장 API에서는 전달받은 스냅샷을 검증해 저장해도 됩니다. 이후 Server가 Visit 생성 시 Catalog를 제공하도록 바꿀 수 있습니다.

---

## 8단계: 조건 충족도 계산

`conditionOperator`가 있는 ChecklistItem만 계산 대상입니다.

현재 조건 예:

- 무료 주차 120분 이상
- 역 도보 5분 이내
- 대절버스 주차 가능
- 비밀 동선 있음
- 신부 전용 화장실 있음
- 예식 간격 90분 이상
- 마이크 잡음 없음
- 축의대 완전 분리
- ATM 있음

`ChecklistFulfillmentCalculator`를 순수 Java 클래스로 작성합니다.

```text
MET       조건 충족
NOT_MET   조건 미충족
UNKNOWN   미작성, 미확인, 해당 없음
```

집계:

```text
evaluatedCount = metCount + unmetCount
percentage = metCount / evaluatedCount × 100
```

UNKNOWN은 분모에서 제외합니다. `evaluatedCount == 0`이면 percentage는 `null`입니다.

계산 결과를 Entity 컬럼으로 저장하지 않습니다.

---

## 9단계: FinalAssessment 구현

MVP에서는 별도 Entity보다 VenueVisit의 Embedded 값 또는 컬럼 묶음으로 관리합니다.

```text
- overallSatisfaction
- overallSatisfactionReason
- priceSatisfaction
- priceSatisfactionReason
- consultationIntent
- contractIntent
- revisitIntent
- pros
- cons
- summary
- detail
- dealBreakerNote
```

`ContractIntent`:

```text
STRONG_CANDIDATE
CONSIDERING
ON_HOLD
REJECT
```

`DealBreaker`:

```text
PRICE
CAPACITY
CEREMONY_INTERVAL
ACCESSIBILITY
PARKING
GUEST_FLOW
BRIDAL_WAITING_ROOM
BANQUET
OTHER
```

Deal Breaker는 복수 선택이므로 별도 값 테이블을 사용합니다.

```text
venue_visit_deal_breaker
- venue_visit_id
- deal_breaker
```

JPA `@ElementCollection Set<DealBreaker>`로 충분합니다. 독립 Entity는 만들지 않습니다.

전체 만족도와 가격 만족도도 1.0~5.0, 0.5 단위로 검증합니다.

---

## 10단계: Visit 저장 API

```http
POST /api/v1/venue-plans/{planId}/visits
GET  /api/v1/venue-plans/{planId}/visits
GET  /api/v1/venue-plans/{planId}/visits/{visitId}
PUT  /api/v1/venue-plans/{planId}/visits/{visitId}
```

저장 Request의 축약 예:

```json
{
  "visitType": "SECRET_TOUR",
  "visitDate": "2026-08-22",
  "visitTime": "14:00",
  "priceSource": "UNKNOWN",
  "price": {
    "baseAndMandatoryAmount": null,
    "pricePerGuest": null,
    "guaranteedGuestCount": null,
    "expectedGuestCount": null,
    "additionalAmount": 0,
    "discountAmount": 0
  },
  "evaluations": [
    {
      "category": "PARKING",
      "status": "RATED",
      "rating": 3.5,
      "reason": "주차 공간은 충분하지만 진입로가 복잡했다.",
      "sortOrder": 1
    }
  ],
  "checklistItems": [
    {
      "checklistType": "SECRET_TOUR",
      "itemCode": "PARKING_FREE_MINUTES",
      "section": "PARKING",
      "itemName": "하객 무료 주차 시간",
      "inputType": "NUMBER",
      "unit": "분",
      "observationStatus": "OBSERVED",
      "answer": 120,
      "note": "",
      "condition": {
        "operator": "GREATER_THAN_OR_EQUAL",
        "expectedValue": 120,
        "successLabel": "2시간 이상 충족"
      },
      "sortOrder": 9
    }
  ],
  "finalAssessment": {
    "overallSatisfaction": 4.5,
    "overallSatisfactionReason": "홀과 운영은 좋았고 주차 진입만 아쉬웠다.",
    "priceSatisfaction": 4.0,
    "priceSatisfactionReason": "",
    "consultationIntent": "YES",
    "contractIntent": "STRONG_CANDIDATE",
    "revisitIntent": "HIGH",
    "pros": "홀 분위기와 직원 진행",
    "cons": "피크타임 진입 정체",
    "summary": "가격만 맞으면 적극 후보",
    "detail": "",
    "dealBreakers": [],
    "dealBreakerNote": ""
  },
  "resultingCandidateStatus": "SHORTLISTED",
  "completed": true
}
```

Application Service의 한 트랜잭션:

1. VenuePlan 존재 확인
2. Request 전체 Validation
3. VenueVisit 저장
4. VenueEvaluation 일괄 저장
5. ChecklistItem 일괄 저장
6. Deal Breaker 저장
7. `resultingCandidateStatus`를 VenuePlan 현재 상태에 반영
8. 계산 결과가 포함된 Response DTO 반환

`PUT` 수정 시 URL의 `planId`와 Visit 소속 Plan이 반드시 일치해야 합니다.

---

## 11단계: Response DTO

Entity를 직접 반환하지 않습니다.

`VenueVisitDetailResponse`:

```text
- visit 기본 정보
- price 입력값
- estimatedMealAmount
- finalEstimatedAmount
- evaluations
- checklistItems
- finalAssessment
- checklistFulfillment
    - metCount
    - unmetCount
    - unknownCount
    - evaluatedCount
    - percentage
- sectionAverage
```

서버 계산값이 Frontend 계산과 달라질 경우 서버 응답을 기준으로 표시합니다.

---

## 12단계: Venue 비교 API

```http
GET /api/v1/venue-plans/compare?ids=1,2,3
```

정책:

- Plan별 가장 최근의 완료된 Visit 사용
- 정렬은 `visitDate DESC, visitTime DESC, id DESC`
- 완료 Visit이 없으면 비교 값은 null

조회 순서:

1. Plan과 Venue 기본 정보 일괄 조회
2. Plan별 최근 완료 Visit ID 일괄 조회
3. Visit ID 목록으로 Evaluation 일괄 조회
4. 주요 Item Code의 ChecklistItem 일괄 조회
5. Application Service에서 Comparison DTO 조립

Evaluation과 Checklist를 동시에 Join Fetch하면 Row가 곱해지므로 피합니다.

`VenueComparisonResponse` 핵심:

```text
- venuePlanId
- venueId
- venueName
- latestVisitId
- overallSatisfaction
- priceSatisfaction
- sectionAverage
- checklistFulfillment
- estimatedPrice
- contractIntent
- dealBreakers
- sectionEvaluations
    - category
    - rating
    - reason
- keyFacts
    - itemCode
    - label
    - displayValue
    - observationStatus
- pros
- cons
- summary
```

---

## 13단계: 예외와 HTTP 응답

최소 예외:

- `VENUE_PLAN_NOT_FOUND` → 404
- `VENUE_VISIT_NOT_FOUND` → 404
- `VISIT_NOT_BELONG_TO_PLAN` → 404 또는 403 중 하나로 통일
- `INVALID_RATING` → 400
- `INVALID_CHECKLIST_ANSWER` → 400
- `DUPLICATE_EVALUATION_CATEGORY` → 400
- `DUPLICATE_CHECKLIST_ITEM_CODE` → 400

`@RestControllerAdvice`에서 공통 Error Response를 반환합니다.

```json
{
  "code": "INVALID_RATING",
  "message": "만족도는 1.0부터 5.0까지 0.5 단위로 입력해야 합니다.",
  "fieldErrors": []
}
```

---

## 14단계: 반드시 작성할 테스트

Domain Unit Test:

- 1.0, 1.5, 5.0 Rating 허용
- 0.5, 3.7, 5.5 Rating 거부
- 미평가 상태에 Rating이 있으면 거부
- 모든 Section 미평가 시 평균 null
- 미평가 Section이 평균에서 제외되는지 확인
- 무료 주차 119분 미충족, 120분 충족
- `false` Answer와 미확인이 구분되는지 확인
- UNKNOWN이 조건 충족도 분모에서 제외되는지 확인
- 모든 조건이 UNKNOWN이면 percentage null
- 가격 계산과 필수값 누락 시 null

Repository Test:

- 최근 완료 Visit 선택
- 미완료 Visit 제외
- 동일 날짜·시간이면 ID로 최신 결정
- Plan과 Visit 소속 검증

API Integration Test:

- VenuePlan 생성과 조회
- Visit Aggregate 전체 저장 후 상세 조회
- 잘못된 Rating 400
- 잘못된 Checklist Answer 타입 400
- 존재하지 않는 Plan 404
- 비교 Plan ID 2개 미만이면 400
- 비교 응답에 평가 이유와 주요 Checklist 사실 포함

가능하면 Testcontainers MySQL로 실제 Flyway Migration과 Repository Query를 검증합니다.

---

## 추천 구현 순서 체크리스트

아래 순서를 그대로 따르면 됩니다.

### Milestone A — 서버와 DB

- [ ] Spring Boot 프로젝트 생성
- [ ] Local MySQL 연결
- [ ] Flyway 설정
- [ ] 공통 예외 응답
- [ ] `./gradlew test` 성공

### Milestone B — 후보 웨딩홀

- [ ] Venue Entity
- [ ] VenuePlan Entity
- [ ] CandidateStatus
- [ ] VenuePlan 생성·목록·상세 API
- [ ] VenuePlan API 통합 테스트

### Milestone C — 방문 저장

- [ ] VenueVisit
- [ ] VenuePrice
- [ ] FinalAssessment
- [ ] VenueEvaluation
- [ ] ChecklistItem
- [ ] DealBreaker 값 테이블
- [ ] Aggregate 저장 API
- [ ] Visit 상세 API

### Milestone D — 계산

- [ ] VenuePriceCalculator
- [ ] SectionRatingCalculator
- [ ] ChecklistFulfillmentCalculator
- [ ] Calculator Unit Test
- [ ] Detail Response에 계산값 추가

### Milestone E — 조회와 비교

- [ ] Visit History
- [ ] 최근 완료 Visit 조회
- [ ] Comparison DTO
- [ ] Compare API
- [ ] N+1 확인
- [ ] 비교 통합 테스트

### Milestone F — Frontend 연결

- [ ] CORS 설정
- [ ] `NEXT_PUBLIC_API_BASE_URL` 설정
- [ ] Local 저장 Adapter와 API Adapter 분리
- [ ] VenuePlan 목록 연결
- [ ] Visit 저장 연결
- [ ] Visit 상세·비교 연결
- [ ] 네트워크 실패 시 작성 중 Draft 유지

Backend를 처음 시작할 때는 **Milestone B까지만 먼저 완료하고 호출 결과를 확인한 뒤** VenueVisit로 넘어가는 것을 권장합니다.
