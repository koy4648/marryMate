# Marry Mate

> 결혼 준비의 선택과 기록을 함께 관리하는 웨딩 플래닝 서비스

Marry Mate는 웨딩홀 탐색부터 예산, 업체와 견적, 계약, 일정까지 흩어지는 결혼 준비 정보를 한곳에 모으기 위한 서비스입니다.

첫 번째 기능은 실제 웨딩홀 방문 현장에서 사용하는 **Venue Tour MVP**입니다. 장기적으로는 커플이 준비 과정을 함께 관리하고, 직접 경험한 웨딩홀 정보를 다른 사용자와 나눌 수 있는 Venue 중심의 후기·커뮤니티 플랫폼으로 확장합니다.

현재 저장소는 개인 포트폴리오 프로젝트로 개발 중입니다. 기능의 수보다 도메인 경계와 설계 의도를 명확하게 설명할 수 있는 구조를 우선합니다.

## 해결하려는 문제

결혼 준비 과정의 정보는 메신저, 메모장, 스프레드시트, 업체별 견적서와 커뮤니티 후기에 흩어지기 쉽습니다.

Marry Mate는 다음 흐름을 하나의 서비스 안에서 연결하는 것을 목표로 합니다.

```text
웨딩홀 탐색과 현장 기록
→ 상담과 견적 비교
→ 계약과 결제 관리
→ 전체 예산 관리
→ 커플 공동 준비
→ 실제 경험을 후기와 사진으로 공유
```

## 현재 Phase: Venue Tour MVP

현재는 전체 서비스의 첫 번째 기능 모듈인 Venue Tour에 집중합니다.

주요 사용자 흐름:

```text
웨딩홀 후보 등록
→ 암행투어 시작
→ 현장에서 사실과 만족도 기록
→ 가격과 최종 판단 정리
→ 방문 기록 저장
→ 여러 웨딩홀 비교
```

MVP 목표 기능:

- 웨딩홀 후보와 방문 이력 관리
- 모바일 우선 암행투어 입력 화면
- Section별 접기·펼치기
- Checklist 기반 객관적인 사실 기록
- Section별 주관적인 만족도와 평가 이유 기록
- 미작성, 미확인, 해당 없음 구분
- 전체 만족도, 장점, 단점, 한줄 총평 기록
- 계약 의향과 Deal Breaker 기록
- 가격 스냅샷과 예상 비용 계산
- Checklist 조건 충족도와 Section 만족도 평균 제공
- 핵심 사실, 만족도, 이유, 가격을 함께 보여주는 Venue 비교
- 현장 입력 자동 임시 저장과 PWA 지원

현재 Frontend는 Backend 없이도 현장에서 사용할 수 있도록 브라우저 로컬 저장소를 사용하는 프로토타입으로 동작합니다. Backend 연동 이후에는 서버 데이터를 Source of Truth로 사용합니다.

## 평가 모델의 핵심 원칙

Marry Mate는 객관적인 사실과 사용자의 주관적인 판단을 하나의 점수로 섞지 않습니다.

| 구분 | 예시 | 역할 |
|---|---|---|
| 객관적인 사실 | 무료 주차 120분, ATM 있음 | `ChecklistItem` |
| Section 만족도 | 주차 만족도 3.5 / 5 | `VenueEvaluation` |
| 평가 이유 | 진입로가 좁고 출차 정체가 걱정됨 | `VenueEvaluation.reason` |
| 최종 판단 | 전체 만족도, 계약 의향 | `FinalAssessment` |

Checklist 중 명확한 통과 기준이 있는 항목만 조건 충족도에 포함합니다. 미확인 항목은 분모에서 제외하며 모든 사실을 억지로 점수화하지 않습니다.

```text
조건 충족도              6 / 8, 75%
Section 만족도 평균      4.2 / 5
사용자 전체 만족도       4.5 / 5
```

세 값은 서로 다른 정보를 나타내므로 하나의 자동 별점으로 합치지 않습니다. 사용자 중요도를 반영한 추천점수는 충분한 사용 데이터가 생긴 이후의 기능으로 남겨둡니다.

## 후기와 커뮤니티 방향

장기적으로 한 Venue에 대한 경험이 준비 단계에 따라 누적되는 구조를 지향합니다.

```text
나의 결혼 준비 과정
암행투어 → 상담 → 계약 → 본식 완료

별도의 실제 경험
하객으로 참석한 후기
```

후기 유형:

- 암행투어 후기: 실제 예식 중인 공간, 동선과 혼잡도 관찰
- 상담 후기: 상담 경험, 일정, 견적과 계약 조건 기록
- 계약 후기: 실제 확정 금액, 혜택과 계약 과정 기록
- 본식 완료 후기: 계약 당시 예상과 실제 본식 경험 비교
- 하객 경험 후기: 접근성, 주차, 로비, 식사와 하객 편의 중심의 경험 공유

식사, 주차, 가격을 각각 별도의 후기 유형으로 만들지 않습니다. 후기 안의 평가 Section과 상세 사실로 관리합니다.

개인 준비 기록과 공개 후기도 곧바로 같은 Entity로 합치지 않습니다. 현재의 `VenueVisit`은 비공개 계획 기록의 Source이며, 향후 공개 시점에 별도의 `Review` 스냅샷을 만드는 방향을 우선 검토합니다.

공개 범위는 다음 단계를 고려합니다.

- `PRIVATE`: 작성자만 조회
- `COUPLE`: Couple Workspace 구성원에게 공유
- `PUBLIC`: 다른 사용자에게 공개

## 모든 후기에 사진 첨부

사진은 특정 후기 유형에 종속된 기능이 아니라 **모든 후기에서 공통으로 지원할 콘텐츠**로 설계합니다.

```text
Review 1:N ReviewMedia N:1 MediaAsset
```

적용 대상:

- 암행투어 사진
- 상담 자료와 견적 관련 사진
- 계약 관련 사진
- 본식 완료 사진
- 하객으로 방문했을 때 촬영한 공간·식사·편의시설 사진

원본 파일은 Object Storage에 저장하고, DB에는 파일 위치와 타입, 크기, 정렬 순서, 설명 같은 메타데이터만 저장합니다. 공개 사진에는 공개 범위 상속, 얼굴과 차량번호 등 개인정보 보호, EXIF 위치정보 제거, 신고와 블라인드 정책이 필요합니다.

영상도 같은 `MediaAsset` 개념으로 확장할 수 있지만 업로드 용량, 썸네일 생성과 인코딩 비용이 크므로 사진 이후 단계에서 지원합니다.

## 제품 모듈

Marry Mate는 하나의 앱 안에 기능 모듈을 점진적으로 추가합니다.

- Venue Tour
- Wedding Budget
- Payment와 Payer
- Vendor와 Quote
- 상담·계약 기록
- Checklist
- Invitation Meeting
- Authentication과 Couple Workspace
- Public Review와 Venue Community
- Point와 Review Unlock

현재 존재하지 않는 기능은 화면이나 Navigation에 미리 노출하지 않습니다. 공통 App Shell 아래에 구현된 모듈만 연결합니다.

현재 Frontend Route:

```text
/venues
/venues/compare
/venues/{venueId}
/venues/{venueId}/visits/new
```

향후 기능은 `/budget`, `/vendors`처럼 독립된 최상위 Route로 추가할 수 있습니다.

## 설계 원칙

- 작은 팀과 포트폴리오에 적합한 Modular Monolith로 시작합니다.
- 패키지는 기술 계층보다 기능과 도메인을 기준으로 나눕니다.
- 공개 가능한 Venue 원본과 사용자별 후보 상태를 분리합니다.
- 방문, 가격과 후기는 당시 정보가 보존되는 스냅샷으로 관리합니다.
- 객관적인 Checklist와 주관적인 Evaluation의 책임을 분리합니다.
- 파생값은 원칙적으로 저장하지 않고 Domain Calculator에서 계산합니다.
- Entity를 REST 응답으로 직접 노출하지 않고 목적별 DTO를 사용합니다.
- 미래 기능을 위해 현재 모델을 과도하게 일반화하지 않습니다.
- 사용자 후기와 광고·Sponsored 콘텐츠를 명확히 분리합니다.

## Architecture

```text
React + TypeScript + Vite + PWA
                 |
              REST API
                 |
    Spring Boot Modular Monolith
                 |
         Spring Data JPA
                 |
               MySQL

Media Upload → Object Storage
```

Backend는 기능별 패키지 안에서 `api`, `application`, `domain`, `infrastructure` 계층을 구분합니다.

```text
com.marrymate
├── common
├── venue
├── wedding
├── budget
├── meal
├── invitation
└── dashboard
```

`review`, `media`, `workspace`, `point` 같은 패키지는 해당 기능을 실제로 구현하는 시점에 추가합니다.

## Tech Stack

### Backend

- Java 17
- Spring Boot 3
- Spring Data JPA
- MySQL
- Gradle

### Frontend

- React
- TypeScript
- Vite / Vinext
- PWA
- Local-first MVP

### Media

- Object Storage 예정
- 사진 우선 지원
- 영상은 후속 단계

## Roadmap

| Phase | 목표 |
|---|---|
| Phase 0 | Venue Tour MVP: 암행투어, 평가, Checklist, 비교 |
| Phase 1–6 | Wedding, Budget, Payment, Invitation, Vendor, Quote |
| Phase 7 | Authentication과 Couple Workspace |
| Phase 8 | 공개 후기, 공개 범위, 모든 후기의 사진 첨부 |
| Phase 9 | 후기 작성 보상, Point Wallet과 Transaction, 후기 Unlock |
| Phase 10 | Venue 중심 Q&A, 댓글, 도움돼요, 신고 |
| Phase 11 | 광고, Premium Listing, Sponsored Promotion |

Point, 공개 커뮤니티, 광고 기능은 현재 MVP에 포함하지 않습니다.

## 실행 방법

현재 실행 가능한 Frontend:

```bash
cd frontend
corepack pnpm install
corepack pnpm dev
```

기본 개발 주소:

```text
http://localhost:3000/venues
```

환경에 따라 사용 중인 Port를 피해 다른 주소가 표시될 수 있습니다.

검증:

```bash
cd frontend
corepack pnpm lint
corepack pnpm test
```

## 프로젝트 문서

- [Requirements](./REQUIREMENTS.md)
- [Architecture](./ARCHITECTURE.md)
- [Development Tasks](./TASKS.md)

문서에는 장기 방향이 포함되어 있지만, 구현은 현재 Phase에 필요한 범위만 진행합니다.
