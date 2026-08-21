# Wedget — Development Tasks

## Priority

현재 가장 높은 우선순위는 **Venue Tour MVP**다.

실제 웨딩홀 방문 현장에서 모바일로 사용할 수 있는 상태를 먼저 만든다.

전체 웨딩 예산 기능보다 다음 흐름을 우선한다.

```text
Venue 등록
→ 암행투어 기록
→ 별점/이유/총평 저장
→ Venue 상세 조회
→ 여러 Venue 비교
```

---

# Phase 0 — Venue Tour MVP

## 0.1 Project Foundation

- [ ] Git repository 기본 구조 확인
- [ ] Backend Spring Boot 3.x 프로젝트 생성
- [ ] Java 17 설정
- [ ] Gradle 설정
- [ ] Frontend React + TypeScript + Vite 프로젝트 생성
- [ ] MySQL 연결
- [ ] Local profile 구성
- [ ] 환경변수 / 비밀정보 관리 방식 결정
- [ ] CORS 설정
- [ ] 공통 Exception Handling
- [ ] 기본 API Response 정책 결정
- [ ] Frontend API Client 기본 구성
- [ ] Mobile Responsive 기본 Layout
- [ ] Backend build 성공 확인
- [ ] Frontend build 성공 확인

---

## 0.2 Venue Domain 설계

- [x] Venue 책임 정의
- [x] VenueVisit 책임 정의
- [x] VenueEvaluation 책임 정의
- [x] Checklist 책임 정의
- [x] ChecklistItem 책임 정의
- [x] Venue와 Vendor 관계 검토
- [x] VenueVisit과 Quote 관계 검토
- [x] Checklist와 Evaluation 분리/통합 여부 결정
- [x] Evaluation Category를 Enum 또는 DB 데이터로 관리할지 결정
- [x] Entity 관계 검토
- [x] ERD 작성
- [x] Enum 설계
- [x] 삭제 정책 결정
- [x] 평균점수 계산 책임 위치 결정
- [x] ARCHITECTURE.md에 결정사항 기록

---

## 0.3 Venue Backend

- [ ] Venue Entity
- [ ] Venue Repository
- [ ] Venue Service
- [ ] Venue DTO
- [ ] Venue Validation
- [ ] Venue 등록 API
- [ ] Venue 목록 API
- [ ] Venue 상세 API
- [ ] Venue 수정 API
- [ ] Venue 후보 상태 변경 API
- [ ] 존재하지 않는 Venue 예외 처리

---

## 0.4 Venue Frontend

- [ ] `/venues` Route
- [ ] Venue 목록 화면
- [ ] Venue Card
- [ ] Venue 추가 Form
- [ ] Venue 수정
- [ ] 후보 상태 표시
- [ ] 비교 대상 선택 UI
- [ ] 새 방문 추가 버튼
- [ ] Mobile Layout 확인

---

## 0.5 VenueVisit Backend

- [ ] VenueVisit Entity
- [ ] VisitType Enum
- [ ] PriceSource Enum
- [ ] RevisitIntent Enum
- [ ] VenueVisit Repository
- [ ] VenueVisit Service
- [ ] VenueVisit DTO
- [ ] Visit 등록 API
- [ ] Visit 상세 API
- [ ] Visit 수정 API
- [ ] Venue별 Visit History API
- [ ] 방문 날짜 저장
- [ ] 방문 시간 저장
- [ ] 방문 유형 저장
- [ ] 가격 출처 저장
- [ ] 좋았던 점 저장
- [ ] 아쉬운 점 저장
- [ ] 한줄 총평 저장
- [ ] 상세 총평 저장
- [ ] 재방문 의향 저장
- [ ] 후보 상태 저장
- [ ] 방문 완료 여부 저장

---

## 0.6 Venue 가격 정보

- [ ] 대관/필수 부대비용
- [ ] 1인 식대
- [ ] 보증 인원
- [ ] 예상 참석 인원
- [ ] 예상 식대
- [ ] 기타 추가비용
- [ ] 할인금액
- [ ] 최종 예상 비용
- [ ] null 가격 허용
- [ ] 금액 음수 Validation
- [x] 가격 계산 위치 결정
- [ ] 가격 계산 Unit Test

---

## 0.7 VenueEvaluation Backend

- [ ] VenueEvaluation Entity
- [ ] 평가 Category 구조
- [ ] Rating 1~5 지원
- [ ] 미확인 상태 지원
- [ ] 평가 이유 저장
- [ ] 중요도 저장
- [ ] 정렬 순서 저장
- [ ] Visit 생성 시 기본 평가 항목 생성
- [ ] Visit 평균 점수 계산
- [ ] 미확인 평가 평균 제외
- [ ] 모든 항목 미확인 시 처리
- [ ] Rating Validation
- [ ] Evaluation 수정 API
- [ ] Evaluation 일괄 저장 API 필요성 검토
- [ ] Unit Test

---

## 0.8 기본 평가 Template

### Hall

- [ ] 홀 디자인
- [ ] 꽃장식
- [ ] 버진로드
- [ ] 조명
- [ ] 음향
- [ ] 하객 시야
- [ ] 실제 수용감

### 신부대기실

- [ ] 디자인
- [ ] 크기
- [ ] 채광
- [ ] 사진 촬영 환경
- [ ] 하객 동선

### 접근성

- [ ] 대중교통 접근성
- [ ] 역에서 실제 이동 편의
- [ ] 건물 찾기 쉬움
- [ ] 지방 하객 접근성

### 주차

- [ ] 차량 진입 동선
- [ ] 주차 공간
- [ ] 출차 편의
- [ ] 혼주 주차
- [ ] 대절버스 주차 가능성

### 하객 동선

- [ ] 로비 크기
- [ ] 로비 혼잡도
- [ ] 다른 예식과 동선 겹침
- [ ] 엘리베이터 대기
- [ ] 축의대 공간

### 연회장

- [ ] 연회장 동선
- [ ] 테이블 간격
- [ ] 좌석 확보
- [ ] 혼잡도
- [ ] 음식 상태
- [ ] 음식 종류
- [ ] 음식 리필 상태

### 운영

- [ ] 예식 간격
- [ ] 직원 응대
- [ ] 안내 상태
- [ ] 화장실
- [ ] 건물 청결도

### 가격

- [ ] 가격 만족도
- [ ] 비용 대비 만족도

---

## 0.9 Secret Tour UI

Route 예시:

```text
/venues/{venueId}/visits/new
```

- [ ] Venue 정보 표시
- [ ] 방문 유형 선택
- [ ] 방문 날짜 입력
- [ ] 방문 시간 입력
- [ ] 가격 정보 입력
- [ ] Section별 평가 UI
- [ ] 모바일용 큰 별점 버튼
- [ ] 미확인 버튼
- [ ] 평가 이유 입력
- [ ] Section 접기 / 펼치기
- [ ] 작성 진행률 표시
- [ ] 미작성 항목만 보기
- [ ] 미확인 항목만 보기
- [ ] 좋았던 점 입력
- [ ] 아쉬운 점 입력
- [ ] 한줄 총평 입력
- [ ] 상세 총평 입력
- [ ] 재방문 의향 선택
- [ ] 후보 상태 선택
- [ ] 저장 버튼
- [ ] 저장 성공 Feedback
- [ ] 저장 실패 Feedback
- [ ] 입력 중 데이터 유실 최소화
- [ ] 모바일 한 손 조작 검토

---

## 0.10 Checklist Backend

- [x] Checklist와 Evaluation의 책임 분리
- [x] MVP에서 ChecklistItem만 Entity로 사용하는 구조 결정
- [x] 기본 Template을 버전 관리 Catalog로 제공하는 방식 결정
- [x] Checklist 상태 정의
- [ ] 암행투어 Checklist Template
- [ ] 실제 상담 Checklist Template
- [ ] Visit 생성 시 Template 적용
- [ ] Checklist 조회 API
- [ ] Checklist Item 상태 수정
- [ ] Checklist Item 메모 수정
- [ ] 사용자 Item 추가/수정/삭제 가능 여부 구현 또는 구조 확보

---

## 0.11 암행투어 Checklist

- [ ] 실제 예식 진행 상황
- [ ] 로비 혼잡도
- [ ] 엘리베이터 대기
- [ ] 버스 주차 위치
- [ ] 신부대기실
- [ ] 연회장
- [ ] 화장실
- [ ] ATM
- [ ] 다른 홀 하객 동선

상태:

- [ ] 미확인
- [ ] 확인
- [ ] 해당 없음

---

## 0.12 실제 상담 Checklist

### 날짜 / 시간

- [ ] 가능한 날짜
- [ ] 가능한 시간
- [ ] 첫 타임 가능 여부
- [ ] 예식 간격

### 비용

- [ ] 대관료
- [ ] 꽃장식
- [ ] 필수 부대비용
- [ ] 1인 식대
- [ ] 보증 인원
- [ ] 최소 보증 인원

### 할인

- [ ] 첫 타임 할인
- [ ] 비수기 할인
- [ ] 잔여 타임 할인
- [ ] 당일 계약 할인
- [ ] 제휴 할인
- [ ] 추가 협의 가능 여부

### 계약

- [ ] 계약금
- [ ] 중도금
- [ ] 잔금
- [ ] 결제 일정
- [ ] 카드 결제
- [ ] 취소 규정
- [ ] 날짜 변경 규정

### 본식

- [ ] 리허설 시간
- [ ] 신부대기실 사용 시간
- [ ] 본식 진행 시간
- [ ] 2부 가능 여부
- [ ] 결혼예배 가능 여부
- [ ] 외부 사회자 가능 여부
- [ ] 축가 가능 여부

### 외부 업체

- [ ] 본식 스냅 지정 여부
- [ ] DVD 지정 여부
- [ ] 아이폰 스냅 가능 여부
- [ ] 외부 스냅 가능 여부
- [ ] 외부 답례품 가능 여부

### 하객

- [ ] 무료 주차 시간
- [ ] 혼주 주차
- [ ] 신랑신부 주차
- [ ] 대절버스 주차
- [ ] 셔틀 여부

### 기타

- [ ] 시식
- [ ] 혼주 식사
- [ ] 폐백
- [ ] 포토테이블
- [ ] 식전 영상

---

## 0.13 Venue Detail

Route 예시:

```text
/venues/{venueId}
```

- [ ] Venue 기본 정보
- [ ] 후보 상태
- [ ] 최근 평균 점수
- [ ] 최근 예상 비용
- [ ] 방문 횟수
- [ ] Visit History
- [ ] Visit별 평균점수
- [ ] Visit별 가격
- [ ] Visit별 좋았던 점
- [ ] Visit별 아쉬운 점
- [ ] Visit별 한줄 총평
- [ ] Visit별 상세 총평
- [ ] Visit별 평가 목록
- [ ] 평가 이유 조회

---

## 0.14 Venue Comparison Backend

- [ ] 비교 Venue ID 목록 입력
- [ ] 최소 2개 Validation
- [ ] Venue별 최근 Visit 기준 비교 정책 결정
- [ ] 평가 Category별 점수 집계
- [ ] 미확인 값 null 처리
- [ ] Venue 평균점수
- [ ] 예상 비용
- [ ] 한줄 총평
- [ ] 후보 상태
- [ ] 평가 이유
- [ ] Comparison Response DTO
- [ ] 비교 Unit Test

---

## 0.15 Venue Comparison Desktop UI

Route:

```text
/venues/compare
```

- [ ] 비교 Venue 선택
- [ ] 최소 2개 선택 Validation
- [ ] Desktop Comparison Table
- [ ] 예상 비용 비교
- [ ] Category별 점수 비교
- [ ] 미확인 `-` 표시
- [ ] 전체 평균 비교
- [ ] 한줄 총평
- [ ] 평가 이유 Expand
- [ ] 후보 상태 표시

---

## 0.16 Venue Comparison Mobile UI

- [ ] Venue Card UI
- [ ] 이전 버튼
- [ ] 다음 버튼
- [ ] Swipe 지원 여부 검토
- [ ] 현재 Venue 위치 표시
- [ ] 예상 비용
- [ ] 평균점수
- [ ] Category별 별점
- [ ] 좋았던 점
- [ ] 아쉬운 점
- [ ] 한줄 총평
- [ ] 상세 평가 이유 접근
- [ ] 작은 화면 대응

---

## 0.17 PWA

- [ ] PWA Manifest
- [ ] App Name `Wedget`
- [ ] App Icon Placeholder
- [ ] Theme 설정
- [ ] Mobile 홈 화면 설치 가능 여부 확인
- [ ] Standalone 실행 확인
- [ ] Offline Sync는 구현하지 않음

---

## 0.18 Venue Tour MVP Test / QA

- [ ] Backend test 통과
- [ ] Frontend build 통과
- [ ] MySQL 데이터 영속성 확인
- [ ] 새로고침 후 데이터 유지
- [ ] 모바일 Chrome 테스트
- [ ] iOS Safari 사용성 확인 가능 범위 검토
- [ ] Venue 등록 → Visit 저장 전체 흐름 확인
- [ ] 미확인 평균 제외 확인
- [ ] Venue 2개 이상 비교 확인
- [ ] 긴 메모 입력 확인
- [ ] 빈 가격으로 Visit 저장 가능 확인

---

# Phase 1 — Wedding Foundation

- [ ] Wedding Entity
- [ ] Wedding Repository
- [ ] Wedding Service
- [ ] 결혼식 날짜
- [ ] 목표 예산
- [ ] 최대 예산
- [ ] 설정 API
- [ ] 설정 페이지
- [ ] D-Day 계산

---

# Phase 2 — Budget Backend

- [ ] BudgetCategory
- [ ] BudgetItem
- [ ] WeddingMealCost
- [ ] 기본 Seed Data
- [ ] Category별 예상비용
- [ ] Category별 실제지출
- [ ] 전체 예상비용
- [ ] 전체 실제지출
- [ ] WeddingMealCost가 본예산 합계에 포함되지 않는지 검증
- [ ] 잔여 예산
- [ ] 사용률
- [ ] Budget Warning
- [ ] Dashboard API
- [ ] Unit Test

---

# Phase 3 — Budget Frontend

- [ ] Dashboard
- [ ] Category별 예산 Card
- [ ] Progress Bar
- [ ] Budget Warning UI
- [ ] Budget Item 목록
- [ ] Budget Item 등록
- [ ] Budget Item 수정
- [ ] Budget Item 삭제
- [ ] 계약/예상 비용 입력
- [ ] 실제 지출 입력
- [ ] 결제 상태 표시
- [ ] 결제자 표시
- [ ] Responsive UI

---

# Phase 4 — Invitation Meeting

- [ ] InvitationMeeting Entity
- [ ] 청첩장 모임 CRUD
- [ ] 모임 구분
- [ ] 예상 비용
- [ ] 실제 비용
- [ ] 참석 예정 인원
- [ ] 실제 참석 인원
- [ ] 1인당 비용
- [ ] 총 모임 횟수
- [ ] 총 참석 인원
- [ ] 구분별 통계
- [ ] 별도 페이지

---

# Phase 5 — Payment / Payer

- [ ] 현재 Budget Item 결제 상태 개선
- [ ] Payment 별도 Domain 도입 여부 재검토
- [ ] 계약금
- [ ] 중도금
- [ ] 잔금
- [ ] 결제 예정일
- [ ] Payer 관리
- [ ] 결제자별 부담액
- [ ] Dashboard 통계

---

# Phase 6 — Vendor / Quote

- [ ] Vendor Domain
- [ ] Vendor CRUD
- [ ] Quote Domain
- [ ] Quote CRUD
- [ ] 동일 업체 여러 견적
- [ ] 동일 Category 업체 비교
- [ ] Venue와 Vendor 연결 전략 적용
- [ ] VenueVisit과 Quote 연결
- [ ] 웨딩홀 실질 예상 총비용 계산
- [ ] 첫 타임 할인
- [ ] 비수기 할인
- [ ] 당일 계약 혜택
- [ ] 보증 인원 / 식대 반영

---

# Phase 7 — Authentication / Couple Workspace

Venue Tour 및 핵심 Budget MVP 이후 진행한다.

- [ ] User Domain
- [ ] 인증 방식 결정
- [ ] 로그인
- [ ] 회원가입
- [ ] CoupleWorkspace
- [ ] WorkspaceMember
- [ ] OWNER / MEMBER
- [ ] 커플 초대 방식 결정
- [ ] 초대코드 또는 초대링크
- [ ] Wedding을 Workspace에 귀속
- [ ] Venue를 Workspace에 귀속
- [ ] Budget을 Workspace에 귀속
- [ ] Checklist를 Workspace에 귀속
- [ ] InvitationMeeting을 Workspace에 귀속
- [ ] 권한 검증
- [ ] 기존 개인 데이터 Migration 전략 검토

---

# Later

- [ ] 평가 항목별 Weight
- [ ] 사용자 정의 Evaluation Template
- [ ] 사용자 정의 Checklist Template
- [ ] 사진 첨부
- [ ] 견적서 파일 첨부
- [ ] Offline Draft
- [ ] 알림
- [ ] 결제일 Reminder
- [ ] 실시간 공동 편집
- [ ] 신혼여행 상세 예산
- [ ] Native App / Capacitor 검토
- [ ] AI 추천
- [ ] 웨딩홀 추천
- [ ] 자동 절감 시뮬레이션

---

# Development Rule

각 Phase는 가능한 작은 Task 단위로 구현한다.

한 번에 전체 REQUIREMENTS를 구현하지 않는다.

각 작업 후 최소한 다음을 확인한다.

- Backend build
- Frontend build
- 관련 Unit Test
- 기존 기능 Regression 여부

중요한 설계 변경은 코드보다 먼저 `ARCHITECTURE.md`에 결정 이유와 Trade-off를 기록한다.

포트폴리오 프로젝트이므로 Codex가 임의로 모든 설계를 확정하지 않는다.

설계 선택지가 존재하는 경우 구현 전에 가능한 방안과 Trade-off를 검토하고 결정한다.
