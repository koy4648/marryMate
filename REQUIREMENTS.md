# Wedget — Requirements

## 1. 프로젝트 개요

**Wedget**은 실제 결혼 준비 과정에서 발생하는 예산, 지출, 계약, 결제, 견적 등을 관리하기 위한 웨딩 플래닝 서비스다.

기존에 Google Spreadsheet로 관리하던 웨딩 예산표를 웹 서비스로 이전하는 것이 1차 목표다.

단순한 CRUD 예제가 아니라 실제 결혼 준비 기간 동안 지속적으로 사용할 수 있는 서비스를 목표로 한다.

초기 버전은 개인 사용을 위한 MVP로 개발하며, 향후 아래 기능으로 확장할 수 있는 구조를 고려한다.

* 웨딩 업체 및 견적 비교
* 계약 및 결제 일정 관리
* 체크리스트
* 커플 공동 관리
* 알림
* 신혼여행 예산 관리
* 모바일 앱 확장

초기 단계에서는 MSA와 같은 과도한 아키텍처를 사용하지 않는다.

유지보수가 쉬운 **모듈형 모놀리스 형태의 웹 애플리케이션**을 기본 구조로 한다.

---

# 2. 핵심 목표

서비스는 다음 기능을 제공해야 한다.

1. 결혼 준비 전체 예산 관리
2. 카테고리별 예산 배분
3. 각 항목별 예산 관리
4. 계약/예상 비용 관리
5. 실제 지출 관리
6. 계약금 / 중도금 / 잔금 등 결제 상태 관리
7. 신랑 / 신부 / 부모님 등 비용 부담자 관리
8. 목표 예산 및 최대 예산 초과 여부 확인
9. 식대 등 본예산 제외 항목 별도 관리
10. 청첩장 모임 비용 별도 관리
11. 스튜디오 / 야외 스냅 / 본식 등 세부 비용 관리
12. 예비비 관리
13. 향후 업체 및 견적 비교 기능 확장

---

# 3. 기술 스택

## Backend

* Java 17
* Spring Boot 3.x
* Spring Data JPA
* MySQL
* Gradle
* Bean Validation
* REST API

## Frontend

* React
* TypeScript
* Vite
* Responsive Web
* PWA

## 기본 프로젝트 구조

```text
wedget/
├── backend/
├── frontend/
├── README.md
├── REQUIREMENTS.md
├── ARCHITECTURE.md
├── TASKS.md
└── .gitignore
```

Backend와 Frontend는 독립적으로 실행 및 빌드할 수 있어야 한다.

로컬 개발 환경에서 쉽게 실행할 수 있어야 한다.

---

# 4. Wedding 기본 설정

하나의 Wedding은 다음 기본 정보를 가진다.

* 결혼식 날짜
* 목표 예산
* 최대 예산

초기 기본값:

* 목표 예산: 20,000,000원
* 최대 예산: 사용자가 직접 설정
* 결혼식 날짜: 사용자가 직접 설정

모든 값은 이후 설정 화면에서 수정할 수 있어야 한다.

---

# 5. Dashboard

메인 화면에서는 전체 웨딩 준비 현황을 한눈에 확인할 수 있어야 한다.

## 5.1 상단 요약 정보

다음 정보를 표시한다.

* 결혼식 날짜
* D-Day
* 목표 예산
* 최대 예산
* 계약/예상 비용
* 실제 지출
* 남은 목표 예산
* 목표 예산 사용률

예:

```text
Wedding Day
2027.09.25
D-400

목표 예산       20,000,000원
계약/예상 비용  13,500,000원
실제 지출        4,200,000원
남은 목표 예산   6,500,000원
```

## 5.2 본예산 제외 항목

다음 항목은 Wedding 본예산과 별도로 관리한다.

* 식대
* 신혼여행
* 청첩장 모임

Dashboard에서도 별도 관리 항목이라는 사실을 명확히 표시한다.

---

# 6. Budget Category

기본 예산 카테고리는 다음과 같다.

1. 예식 (식대 제외)
2. 드레스
3. 스튜디오 & 야외 스냅
4. 메이크업
5. 예복·혼주
6. 예단·예물
7. 교통·하객지원
8. 기타 준비
9. 예비비

각 Category는 다음 값을 가진다.

* 카테고리명
* 정렬 순서
* 배정 예산
* 목표 비율
* 계약/예상 비용
* 실제 지출
* 잔여 예산
* 사용률
* 진행률

---

# 7. Category 계산 규칙

## 목표 비율

```text
카테고리 배정 예산 / 전체 목표 예산
```

## 계약/예상 비용

```text
Category에 속한 Budget Item의 계약/예상 비용 합계
```

## 실제 지출

```text
Category에 속한 Budget Item의 실제 지출 합계
```

## 잔여 예산

```text
배정 예산 - 계약/예상 비용
```

## 사용률

```text
계약/예상 비용 / 배정 예산
```

배정 예산이 0원인 경우 division by zero가 발생하지 않아야 한다.

카테고리의 배정 예산이나 Budget Item 금액이 변경되면 관련 계산 결과가 즉시 다시 계산되어야 한다.

---

# 8. Budget Progress UI

Category별 예산 사용률을 Progress Bar로 표시한다.

예:

```text
예식

████████░░ 82%
```

상태는 다음과 같이 구분한다.

| 사용률      | 상태    |
| -------- | ----- |
| 0 ~ 79%  | 정상    |
| 80 ~ 99% | 주의    |
| 100%     | 예산 소진 |
| 100% 초과  | 예산 초과 |

전체 Wedding 예산 역시 동일한 방식으로 표시한다.

---

# 9. Budget Item

각 Category에는 여러 개의 Budget Item이 존재한다.

Budget Item은 다음 값을 가진다.

* 카테고리
* 항목명
* 필수/선택 상태
* 예산
* 계약/예상 비용
* 실제 지출
* 차액
* 결제 예정일
* 결제 상태
* 결제자
* 비고
* 정렬 순서

## 차액

```text
예산 - 계약/예상 비용
```

---

# 10. Item 중요도

각 Budget Item은 다음 상태 중 하나를 가진다.

* 필수
* 선택
* 셀프
* 미정

UI에서는 Dropdown으로 변경할 수 있어야 한다.

선택 항목은 추후 예산 절감 후보로 활용할 수 있도록 데이터 구조를 설계한다.

향후 다음 기능을 지원할 수 있어야 한다.

```text
선택 항목을 모두 제외했을 경우 절약 가능한 금액 계산
```

---

# 11. 결제 상태

Budget Item은 다음 결제 상태를 가질 수 있다.

* 미계약
* 견적 확인
* 계약금
* 중도금
* 잔금 예정
* 완납
* 취소

MVP에서는 Budget Item에 현재 결제 상태와 대표 결제 예정일을 저장할 수 있다.

향후 계약금 / 중도금 / 잔금을 개별 Payment 데이터로 관리할 수 있도록 확장 가능성을 고려한다.

---

# 12. 결제자

각 비용에는 결제자를 기록할 수 있어야 한다.

기본 결제자:

* 신부
* 신랑
* 공동
* 신부측 부모님
* 신랑측 부모님
* 기타

향후 사용자가 직접 결제자를 추가할 수 있는 구조를 고려한다.

Dashboard 또는 통계 화면에서는 다음 금액을 확인할 수 있어야 한다.

* 신부 부담액
* 신랑 부담액
* 공동 부담액
* 신부측 부모님 부담액
* 신랑측 부모님 부담액
* 기타 부담액

---

# 13. 예식 카테고리

기본 Budget Item:

* 대관비
* 식대
* 부케
* 사회자
* 축가
* 가방순이
* 헬퍼비
* 주례/결혼예배 사례비
* 본식 스냅
* 본식 원판
* 본식 DVD
* 서브 스냅
* 아이폰 스냅
* 식전 영상
* 웨딩카

기본 상태:

### 필수

* 대관비
* 본식 스냅
* 본식 원판

### 선택

* 사회자
* 축가
* 가방순이
* 본식 DVD
* 서브 스냅
* 아이폰 스냅
* 식전 영상
* 웨딩카

기본 비고:

아이폰 스냅:

```text
친구 촬영으로 대체 가능
```

식전 영상:

```text
무료 제작 툴 활용 가능
```

웨딩카:

```text
자차 이용 가능
```

---

# 14. 식대 관리

식대는 예식과 관련된 비용이지만 Wedding 본예산에서는 제외한다.

다음 값을 별도로 계산한다.

* 식대 예상 총액
* 식대 실제 지출
* 예식 합계 (식대 제외)
* 예식 전체 예상 결제액

## 예식 전체 예상 결제액

```text
예식 비용(식대 제외) + 식대
```

향후 아래 값으로 식대 예상 금액을 자동 계산할 수 있어야 한다.

* 보증 인원
* 예상 참석 인원
* 1인 식대

예:

```text
보증 인원 × 1인 식대
```

보증 인원과 실제 참석 인원을 별도로 관리할 수 있는 구조를 고려한다.

---

# 15. 드레스

기본 Budget Item:

* 드레스 투어
* 본식 드레스
* 본식 드레스 추가금
* 2부 드레스
* 웨딩슈즈
* 헤어 액세서리
* 기타

### 필수

* 본식 드레스

### 선택

* 본식 드레스 추가금
* 2부 드레스
* 웨딩슈즈
* 헤어 액세서리

---

# 16. 스튜디오 & 야외 스냅

하나의 Category 아래에서 두 Section으로 구분한다.

## Studio

기본 Item:

* 스튜디오 촬영
* 헤어변형
* 촬영 소품
* 촬영 드레스 추가금
* 원본
* 사진/앨범 추가금
* 얼리/레이트 스타트 비용

## Outdoor Snap

기본 Item:

* 스냅 촬영
* 헤어메이크업
* 의상 대여
* 촬영 소품
* 장소 대관료
* 교통비/주차비
* 숙박비
* 헬퍼비
* 원본/수정본
* 기타

다음 소계를 각각 확인할 수 있어야 한다.

* Studio 예상 비용
* Studio 실제 지출
* Outdoor Snap 예상 비용
* Outdoor Snap 실제 지출
* 전체 Category 합계

이를 위해 Budget Item에 선택적으로 Section 정보를 둘 수 있다.

예:

```text
STUDIO
OUTDOOR_SNAP
```

---

# 17. 메이크업

기본 Budget Item:

* 본식 신부 헤어메이크업
* 신랑 헤어메이크업
* 얼리/레이트 스타트 비용
* 혼주 헤어메이크업
* 웨딩 네일
* 웨딩 케어

### 필수

* 본식 신부 헤어메이크업
* 신랑 헤어메이크업

### 선택

* 혼주 헤어메이크업
* 웨딩 네일
* 웨딩 케어

---

# 18. 예복·혼주

기본 Budget Item:

* 신랑 예복
* 신랑 예복 대여비
* 혼주 정장
* 혼주 한복

각 비용은 독립적으로 예산 / 예상 비용 / 실제 지출을 관리한다.

---

# 19. 예단·예물

기본 Budget Item:

* 웨딩밴드
* 부모님 예단
* 기타 예물

### 필수

* 웨딩밴드

### 선택

* 부모님 예단
* 기타 예물

부모님 예단과 기타 예물은 초기 예산을 0원으로 둘 수 있다.

---

# 20. 교통·하객지원

기본 Budget Item:

* 대절버스
* 기사님 식대/수고비
* 주차비
* 통행료
* 장거리 하객 숙박
* 기타 교통비

## 대절버스 상세 정보

대절버스에는 필요할 경우 다음 부가정보를 저장할 수 있어야 한다.

* 출발지
* 도착지
* 버스 대수
* 버스 인승
* 편도 / 왕복
* 업체
* 연락처
* 출발 시간
* 복귀 시간
* 비고

현재 예상 사용 사례:

```text
출발지: 세종
도착지: 서울
버스 인승: 45인승
버스 대수: 2대
운행 형태: 왕복
```

향후 전세버스 업체별 견적 비교 기능과 연결할 수 있는 구조를 고려한다.

---

# 21. 기타 준비

기본 Budget Item:

* 양가 인사/선물
* 상견례 비용
* 청첩장
* 모바일 청첩장
* 식권
* 방명록
* 답례품
* 혼주 꽃/코사지
* 폐백
* 지인 사례비
* 기타

청첩장 모임 비용은 이 Category에 포함하지 않는다.

---

# 22. 예비비

예비비는 독립된 Budget Category로 관리한다.

예상하지 못한 비용이 발생했을 때만 사용하는 것을 목적으로 한다.

Dashboard에서는 다음 정보를 제공한다.

* 예비비 배정 금액
* 예비비 사용 금액
* 예비비 잔액

---

# 23. 청첩장 모임

청첩장 모임은 Wedding 본예산과 완전히 별도로 관리한다.

독립된 메뉴와 페이지를 제공한다.

## 23.1 상단 요약

다음 정보를 표시한다.

* 목표 예산
* 예상 총비용
* 실제 지출
* 남은 예산
* 총 모임 횟수
* 총 참석 인원
* 1인당 평균 비용

## 23.2 Invitation Meeting

각 모임은 다음 데이터를 가진다.

* 모임명
* 구분
* 날짜
* 장소
* 참석 예정 인원
* 실제 참석 인원
* 예상 비용
* 실제 비용
* 1인당 비용
* 결제자
* 결제 상태
* 비고

## 23.3 모임 구분

* 회사
* 대학
* 고등학교
* 교회
* 친구
* 가족
* 기타

## 23.4 1인당 비용

```text
실제 비용 / 실제 참석 인원
```

실제 참석 인원이 0명 또는 null인 경우 계산하지 않는다.

division by zero가 발생하지 않아야 한다.

## 23.5 추가 통계

구분별 다음 정보를 제공한다.

* 모임 횟수
* 참석 인원
* 실제 지출
* 평균 1인당 비용

---

# 24. 신혼여행

MVP에서는 신혼여행 상세 관리 기능을 구현하지 않아도 된다.

Dashboard 또는 별도 메뉴에 다음 상태만 표시한다.

```text
신혼여행 예산 별도 관리
```

향후 다음 항목을 관리할 예정이다.

* 항공권
* 숙박
* 현지 교통
* 식비
* 티켓/관광
* 쇼핑
* 여행자 보험
* 기타

향후 기능 추가를 방해하지 않는 수준으로만 구조를 고려한다.

---

# 25. Vendor

향후 웨딩 업체를 관리하기 위한 Vendor Domain을 고려한다.

지원 예정 업체 Category:

* 웨딩홀
* 드레스샵
* 메이크업샵
* 스튜디오
* 야외 스냅
* 본식 스냅
* DVD
* 예복
* 웨딩밴드
* 전세버스
* 기타

Vendor 기본 정보:

* 업체명
* 업체 Category
* 연락처
* URL
* 담당자
* 주소
* 메모

---

# 26. Quote

하나의 Vendor는 여러 개의 Quote를 가질 수 있다.

Quote 기본 정보:

* 업체
* 견적일
* 기본금
* 할인금액
* 추가비용
* 최종 예상금액
* 포함사항
* 제외사항
* 유효기간
* 메모

동일 업체의 여러 견적과 동일 Category에 속한 여러 업체의 견적을 비교할 수 있어야 한다.

MVP에서는 완전한 비교 UI까지 구현하지 않아도 된다.

---

# 27. 향후 웨딩홀 견적 비교

웨딩홀 Quote에서는 추후 다음 데이터를 관리할 수 있도록 고려한다.

* 대관료
* 꽃장식
* 필수 부대비용
* 1인 식대
* 보증 인원
* 예상 참석 인원
* 최소 식대
* 할인
* 첫 타임 할인
* 비수기 할인
* 당일 계약 혜택
* 기타 추가비용

단순 대관료가 아니라 **실질 예상 총비용**을 계산할 수 있도록 확장할 예정이다.

예:

```text
실질 예상 총비용
= 대관료
+ 필수 옵션
+ 예상 식대
- 할인
```

---

# 28. 전체 예산 계산 규칙

## 전체 계약/예상 비용

```text
식대 / 신혼여행 / 청첩장 모임을 제외한
모든 Budget Item 계약/예상 비용의 합
```

## 전체 실제 지출

```text
식대 / 신혼여행 / 청첩장 모임을 제외한
모든 Budget Item 실제 지출의 합
```

## 남은 목표 예산

```text
목표 예산 - 전체 계약/예상 비용
```

## 전체 사용률

```text
전체 계약/예상 비용 / 목표 예산
```

Backend를 Budget 계산의 Source of Truth로 사용한다.

Frontend에서 UX를 위해 동일한 계산을 수행할 수 있으나 최종 데이터는 Backend 계산 결과를 기준으로 한다.

---

# 29. Budget Warning

## Category Warning

### 사용률 80% 이상

```text
예산의 80% 이상을 사용했습니다.
```

### 사용률 100%

```text
카테고리 예산을 모두 사용했습니다.
```

### 사용률 100% 초과

```text
카테고리 예산을 초과했습니다.
```

## 전체 Budget Warning

### 목표 예산 초과

```text
목표 예산을 초과했습니다.
```

### 최대 예산 초과

```text
최대 예산을 초과했습니다.
```

## Budget Item Warning

다음 조건을 만족하면 예산 초과 상태로 표시한다.

```text
계약/예상 비용 > 항목 예산
```

---

# 30. UX / UI 요구사항

웨딩 서비스의 분위기는 유지하되 기업용 ERP처럼 딱딱한 디자인은 피한다.

반대로 지나치게 유아틱하거나 핑크색 중심의 디자인도 피한다.

전체적으로 깔끔하고 밝은 Wedding Planner 스타일을 지향한다.

## 기본 디자인 방향

* 밝은 배경
* 넉넉한 여백
* Card 기반 Dashboard
* 적당한 Border Radius
* 명확한 Typography
* 숫자 가독성 우선
* Mobile First 또는 Responsive Design
* 예산 초과 상태를 쉽게 확인 가능
* Desktop / Mobile 모두 사용 가능

금액은 천 단위 구분을 적용한다.

예:

```text
2,000,000원
```

또는

```text
₩2,000,000
```

---

# 31. PWA

서비스는 모바일에서도 자주 사용할 가능성이 높으므로 PWA를 지원한다.

목표:

* 스마트폰 브라우저에서 정상 사용
* 홈 화면 추가 가능
* 앱과 유사한 실행 경험
* Responsive UI

초기 MVP에서는 Offline 기능을 복잡하게 구현할 필요는 없다.

향후 필요하면 Capacitor 등을 이용해 iOS / Android 앱으로 확장할 수 있다.

---

# 32. 화면 구성

MVP Navigation은 다음과 같이 구성한다.

1. Dashboard
2. 웨딩 예산
3. 청첩장 모임
4. 업체 / 견적
5. 설정

## Dashboard

전체 Wedding 예산 및 진행 현황

## 웨딩 예산

Category / Budget Item 상세 관리

## 청첩장 모임

청첩장 모임 예산 및 모임별 비용 관리

## 업체 / 견적

Vendor 및 Quote 관리

초기에는 기본 CRUD 또는 Placeholder 수준으로 구현 가능하다.

## 설정

* 결혼식 날짜
* 목표 예산
* 최대 예산

---

# 33. Domain Model

초기 Domain 후보:

```text
Wedding
BudgetCategory
BudgetItem
Payment
Payer
InvitationMeeting
Vendor
Quote
```

위 구조를 반드시 그대로 사용할 필요는 없다.

구현 전에 Domain 책임과 Entity 관계를 검토한다.

다음 원칙을 따른다.

* 불필요한 Entity 분리 금지
* 불필요한 양방향 연관관계 금지
* 중복 데이터 최소화
* 핵심 비즈니스 규칙을 명확하게 표현
* 향후 기능 추가가 가능한 구조
* 과도한 추상화 방지

---

# 34. REST API

RESTful API를 사용한다.

예시:

```http
GET /api/weddings/{weddingId}
PATCH /api/weddings/{weddingId}

GET /api/weddings/{weddingId}/dashboard

GET /api/weddings/{weddingId}/budget/categories
POST /api/weddings/{weddingId}/budget/categories

PATCH /api/budget/categories/{categoryId}
DELETE /api/budget/categories/{categoryId}

POST /api/budget/categories/{categoryId}/items

PATCH /api/budget/items/{itemId}
DELETE /api/budget/items/{itemId}

GET /api/weddings/{weddingId}/invitation-meetings
POST /api/weddings/{weddingId}/invitation-meetings

PATCH /api/invitation-meetings/{meetingId}
DELETE /api/invitation-meetings/{meetingId}
```

실제 Domain 구조에 더 적합한 URI가 있다면 개선할 수 있다.

---

# 35. Seed Data

개발 직후 실제 UI를 확인할 수 있도록 기본 Seed Data를 제공한다.

새로운 Wedding 생성 시 기본적으로 다음을 생성할 수 있다.

```text
Wedding
 └─ BudgetCategory
      └─ BudgetItem
```

기본 Category와 Item은 본 문서에 정의된 목록을 기준으로 한다.

운영 데이터와 개발용 Seed Data의 생명주기는 명확하게 구분한다.

---

# 36. Validation

다음 값을 검증한다.

* 금액 < 0 금지
* 목표 예산 <= 0 금지
* 최대 예산 <= 0 금지
* 참석 인원 < 0 금지
* 버스 대수 < 0 금지
* 유효하지 않은 결혼식 날짜 방지
* 존재하지 않는 Category 접근 방지
* 존재하지 않는 Item 접근 방지
* 삭제된 데이터 참조 방지
* division by zero 방지

Backend Validation 및 전역 Exception Handling을 적용한다.

---

# 37. 테스트

핵심 Business Logic에는 Unit Test를 작성한다.

최소 테스트 범위:

* Category 예상 비용 합계
* Category 실제 지출 합계
* 전체 예상 비용 계산
* 전체 실제 지출 계산
* 식대 제외 계산
* 잔여 예산 계산
* 사용률 계산
* 목표 예산 초과 판정
* 최대 예산 초과 판정
* Budget Item 예산 초과 판정
* Invitation Meeting 1인당 비용 계산
* 참석 인원 0명일 때 division by zero 방지

Controller E2E 테스트보다 핵심 Domain / Service Test를 우선한다.

---

# 38. 개발 원칙

## Backend

* Controller에 Business Logic을 작성하지 않는다.
* Entity를 API Response로 직접 반환하지 않는다.
* DTO를 사용한다.
* Transaction Boundary를 명확하게 관리한다.
* N+1 문제를 고려한다.
* 무분별한 EAGER Loading을 피한다.
* 무분별한 양방향 연관관계를 피한다.
* 삭제 정책을 명확하게 정의한다.
* 날짜와 시간 타입을 적절하게 구분한다.
* 핵심 계산 로직은 한 곳에서 관리한다.

## Money

금액 계산에 Floating Point 타입을 사용하지 않는다.

Java에서는 금액 단위에 따라 다음 중 적절한 방식을 선택한다.

* long
* BigDecimal

DB에서도 적절한 정수형 또는 DECIMAL을 사용한다.

선택 이유는 Architecture 문서에 기록한다.

## Frontend

* Server State와 UI State를 구분한다.
* 금액 Formatting 로직을 공통화한다.
* API Error를 사용자에게 이해 가능한 방식으로 표시한다.
* Mobile 환경에서도 입력이 편해야 한다.

---

# 39. README

README에는 최소 다음 내용을 포함한다.

* 프로젝트 소개
* 개발 배경
* 주요 기능
* 기술 스택
* 실행 방법
* DB 설정
* 주요 Domain 설명
* ERD
* API 구조
* 예산 계산 규칙
* 주요 기술적 의사결정
* 향후 개발 계획

---

# 40. Architecture 문서

`ARCHITECTURE.md`에는 다음 내용을 기록한다.

* 전체 Architecture
* Backend Package 구조
* Frontend 구조
* Domain 관계
* ERD
* 금액 타입 선정 이유
* Business Logic 책임
* Transaction Boundary
* 삭제 정책
* 주요 기술 선택과 Trade-off

Codex가 임의로 Architecture를 확정하지 않고, 중요한 설계 변경은 문서에 기록한다.

---

# 41. 구현 단계

## Phase 1 — Foundation

* Backend 프로젝트 설정
* Frontend 프로젝트 설정
* MySQL 연결
* 기본 Environment 구성
* Wedding 기본 설정
* 초기 Domain 설계

## Phase 2 — Budget Backend

* BudgetCategory
* BudgetItem
* 기본 Seed Data
* Budget 계산 로직
* Validation
* Dashboard API
* Unit Test

## Phase 3 — Budget Frontend

* Dashboard UI
* Budget Category UI
* Budget Item CRUD
* Progress Bar
* Budget Warning
* Responsive UI

## Phase 4 — Invitation Meeting

* 청첩장 모임 CRUD
* 비용 계산
* Dashboard
* 구분별 통계

## Phase 5 — Payment / Payer

* 결제 상태 관리 개선
* 결제자 관리
* 결제자별 부담액 통계

## Phase 6 — Vendor / Quote

* 업체 관리
* 견적 관리
* 비교 기능 기반

각 Phase가 완료된 시점에는 애플리케이션이 정상적으로 실행 가능한 상태를 유지해야 한다.

---

# 42. MVP 완료 기준

다음 사용자 흐름이 정상 동작해야 한다.

1. Wedding 생성 또는 초기 데이터 로딩
2. 결혼식 날짜 설정
3. 목표 예산 설정
4. 최대 예산 설정
5. Dashboard 전체 예산 확인
6. Category별 배정 예산 확인
7. Budget Item 생성 / 수정 / 삭제
8. 항목별 예산 입력
9. 계약/예상 비용 입력
10. 실제 지출 입력
11. Dashboard와 Category 금액 즉시 갱신
12. 결제 상태 확인
13. 결제자 확인
14. 목표 예산 초과 경고
15. 최대 예산 초과 경고
16. 식대 별도 계산
17. 청첩장 모임 별도 등록
18. 청첩장 모임 총비용 계산
19. 청첩장 모임 1인당 비용 계산
20. 새로고침 이후에도 DB 데이터 유지
21. PC와 모바일에서 정상 사용
22. PWA 설치 가능

---

# 43. Non-Goals — MVP에서 하지 않는 것

초기 MVP에서는 다음 기능을 우선 구현하지 않는다.

* MSA
* Kubernetes
* Event Driven Architecture
* 복잡한 CQRS
* 실시간 공동 편집
* 채팅
* 소셜 기능
* AI 추천
* 복잡한 권한 시스템
* 네이티브 iOS / Android 앱
* 과도한 디자인 시스템
* 신혼여행 상세 관리
* 알림 시스템
* 외부 결제 연동

필요성이 확인되면 이후 단계에서 추가한다.

---

# 44. 최종 원칙

Wedget은 기능 수가 많은 서비스보다,

**실제 결혼 준비 과정에서 유용하게 사용할 수 있고, 핵심 Domain과 Business Logic을 명확하게 설명할 수 있는 서비스**

를 목표로 한다.

단순 CRUD보다 다음 영역의 설계 품질을 우선한다.

* Budget 계산
* 실제 지출과 예상 비용의 분리
* 본예산과 별도 비용의 분리
* Payment 상태
* Payer별 부담액
* Category별 예산 배분
* 예산 초과 판단
* Vendor / Quote 비교 구조

새로운 기능을 추가할 때에는 현재 MVP 구조를 불필요하게 복잡하게 만들지 않는 것을 우선한다.
