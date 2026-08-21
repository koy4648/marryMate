# Wedget — Requirements

## 1. 프로젝트 개요

**Wedget**은 실제 결혼 준비 과정에서 발생하는 예산, 지출, 계약, 결제, 견적, 웨딩홀 방문 기록 등을 관리하기 위한 웨딩 플래닝 서비스다.

기존에 Google Spreadsheet로 관리하던 웨딩 예산표를 웹 서비스로 이전하는 것이 1차 목표이며, 실제 결혼 준비 기간 동안 지속적으로 사용할 수 있는 서비스를 목표로 한다.

초기 버전은 개인 사용을 위한 MVP로 개발한다. 이후 아래 기능으로 확장할 수 있는 구조를 고려한다.

- 웨딩 업체 및 견적 비교
- 계약 및 결제 일정 관리
- 체크리스트
- 커플 공동 관리
- 알림
- 신혼여행 예산 관리
- 모바일 앱 확장
- 사용자별 웨딩홀 평가 가중치
- 사진/파일 첨부

초기 단계에서는 MSA와 같은 과도한 아키텍처를 사용하지 않는다.

유지보수가 쉬운 **모듈형 모놀리스 형태의 웹 애플리케이션**을 기본 구조로 한다.

---

## 2. 핵심 목표

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
13. 웨딩홀 후보 등록 및 방문 기록
14. 암행투어 현장 평가
15. 공식 상담 체크리스트
16. 웨딩홀별 가격/별점/평가 이유/총평 저장
17. 여러 웨딩홀 비교
18. 향후 업체 및 견적 비교 기능 확장

---

## 3. 기술 스택

### Backend

- Java 17
- Spring Boot 3.x
- Spring Data JPA
- MySQL
- Gradle
- Bean Validation
- REST API

### Frontend

- React
- TypeScript
- Vite
- Responsive Web
- PWA

### 기본 프로젝트 구조

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

## 4. Wedding 기본 설정

하나의 Wedding은 다음 기본 정보를 가진다.

- 결혼식 날짜
- 목표 예산
- 최대 예산

초기 기본값:

- 목표 예산: 20,000,000원
- 최대 예산: 사용자가 직접 설정
- 결혼식 날짜: 사용자가 직접 설정

모든 값은 이후 설정 화면에서 수정할 수 있어야 한다.

---

## 5. Dashboard

메인 화면에서는 전체 웨딩 준비 현황을 한눈에 확인할 수 있어야 한다.

### 5.1 상단 요약 정보

다음 정보를 표시한다.

- 결혼식 날짜
- D-Day
- 목표 예산
- 최대 예산
- 계약/예상 비용
- 실제 지출
- 남은 목표 예산
- 목표 예산 사용률

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

### 5.2 본예산 제외 항목

다음 항목은 Wedding 본예산과 별도로 관리한다.

- 식대
- 신혼여행
- 청첩장 모임

Dashboard에서도 별도 관리 항목이라는 사실을 명확히 표시한다.

---

## 6. Budget Category

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

- 카테고리명
- 정렬 순서
- 배정 예산
- 목표 비율
- 계약/예상 비용
- 실제 지출
- 잔여 예산
- 사용률

목표 비율, 계약/예상 비용, 실제 지출, 잔여 예산, 사용률은 저장값이 아니라 계산 결과다.

---

## 7. Category 계산 규칙

### 목표 비율

```text
카테고리 배정 예산 / 전체 목표 예산
```

### 계약/예상 비용

```text
Category에 속한 Budget Item의 계약/예상 비용 합계
```

### 실제 지출

```text
Category에 속한 Budget Item의 실제 지출 합계
```

### 잔여 예산

```text
배정 예산 - 계약/예상 비용
```

### 사용률

```text
계약/예상 비용 / 배정 예산
```

배정 예산이 0원인 경우 division by zero가 발생하지 않아야 한다.

- 배정 예산과 계약/예상 비용이 모두 0원이면 사용률은 0%다.
- 배정 예산이 0원이고 계약/예상 비용이 있으면 사용률은 계산하지 않고 예산 초과 상태로 표시한다.

카테고리의 배정 예산이나 Budget Item 금액이 변경되면 관련 계산 결과가 즉시 다시 계산되어야 한다.

---

## 8. Budget Progress UI

Category별 예산 사용률을 Progress Bar로 표시한다.

```text
예식
████████░░ 82%
```

상태는 다음과 같이 구분한다.

| 사용률 | 상태 |
|---|---|
| 0 ~ 79% | 정상 |
| 80 ~ 99% | 주의 |
| 100% | 예산 소진 |
| 100% 초과 | 예산 초과 |

전체 Wedding 예산 역시 동일한 방식으로 표시한다.

---

## 9. Budget Item

각 Category에는 여러 개의 Budget Item이 존재한다.

Budget Item은 다음 값을 가진다.

- 카테고리
- 항목명
- 필수/선택 상태
- 예산
- 계약/예상 비용
- 실제 지출
- 차액
- 결제 예정일
- 결제 상태
- 결제자
- 비고
- 정렬 순서

### 차액

```text
예산 - 계약/예상 비용
```

---

## 10. Item 중요도

각 Budget Item은 다음 상태 중 하나를 가진다.

- 필수
- 선택
- 셀프
- 미정

UI에서는 Dropdown으로 변경할 수 있어야 한다.

선택 항목은 추후 예산 절감 후보로 활용할 수 있도록 데이터 구조를 설계한다.

향후 다음 기능을 지원할 수 있어야 한다.

```text
선택 항목을 모두 제외했을 경우 절약 가능한 금액 계산
```

---

## 11. 결제 상태

Budget Item은 다음 결제 상태를 가질 수 있다.

- 미계약
- 견적 확인
- 계약금
- 중도금
- 잔금 예정
- 완납
- 취소

MVP에서는 Budget Item에 현재 결제 상태와 대표 결제 예정일을 저장할 수 있다.

향후 계약금 / 중도금 / 잔금을 개별 Payment 데이터로 관리할 수 있도록 확장 가능성을 고려한다.

---

## 12. 결제자

각 비용에는 결제자를 기록할 수 있어야 한다.

기본 결제자:

- 신부
- 신랑
- 공동
- 신부측 부모님
- 신랑측 부모님
- 기타

향후 사용자가 직접 결제자를 추가할 수 있는 구조를 고려한다.

Dashboard 또는 통계 화면에서는 다음 금액을 확인할 수 있어야 한다.

- 신부 부담액
- 신랑 부담액
- 공동 부담액
- 신부측 부모님 부담액
- 신랑측 부모님 부담액
- 기타 부담액

---

## 13. 예식 카테고리

기본 Budget Item:

- 대관비
- 부케
- 사회자
- 축가
- 가방순이
- 헬퍼비
- 주례/결혼예배 사례비
- 본식 스냅
- 본식 원판
- 본식 DVD
- 서브 스냅
- 아이폰 스냅
- 식전 영상
- 웨딩카

기본 상태:

### 필수

- 대관비
- 본식 스냅
- 본식 원판

### 선택

- 사회자
- 축가
- 가방순이
- 본식 DVD
- 서브 스냅
- 아이폰 스냅
- 식전 영상
- 웨딩카

기본 비고:

```text
아이폰 스냅: 친구 촬영으로 대체 가능
식전 영상: 무료 제작 툴 활용 가능
웨딩카: 자차 이용 가능
```

---

## 14. 식대 관리

식대는 예식과 관련된 비용이지만 Wedding 본예산에서는 제외한다.

식대를 예식 Category의 특수한 Budget Item으로 두지 않고, Wedding에 속한 별도 `WeddingMealCost`로 관리한다. 이 경계를 통해 본예산 집계에 식대 제외 조건이 반복되는 것을 방지한다.

MVP 저장 값:

- 식대 예상 총액
- 식대 실제 지출

Dashboard에서는 다음 값을 별도로 표시하거나 계산한다.

- 식대 예상 총액
- 식대 실제 지출
- 예식 합계 (식대 제외)
- 예식 전체 예상 결제액

### 예식 전체 예상 결제액

```text
예식 비용(식대 제외) + 식대
```

향후 아래 값으로 식대 예상 금액을 자동 계산할 수 있어야 한다.

- 보증 인원
- 예상 참석 인원
- 1인 식대

예:

```text
보증 인원 × 1인 식대
```

보증 인원과 실제 참석 인원을 별도로 관리할 수 있는 구조를 고려한다.

---

## 15. 드레스

기본 Budget Item:

- 드레스 투어
- 본식 드레스
- 본식 드레스 추가금
- 2부 드레스
- 웨딩슈즈
- 헤어 액세서리
- 기타

### 필수

- 본식 드레스

### 선택

- 본식 드레스 추가금
- 2부 드레스
- 웨딩슈즈
- 헤어 액세서리

---

## 16. 스튜디오 & 야외 스냅

하나의 Category 아래에서 두 Section으로 구분한다.

### Studio

- 스튜디오 촬영
- 헤어변형
- 촬영 소품
- 촬영 드레스 추가금
- 원본
- 사진/앨범 추가금
- 얼리/레이트 스타트 비용

### Outdoor Snap

- 스냅 촬영
- 헤어메이크업
- 의상 대여
- 촬영 소품
- 장소 대관료
- 교통비/주차비
- 숙박비
- 헬퍼비
- 원본/수정본
- 기타

다음 소계를 각각 확인할 수 있어야 한다.

- Studio 예상 비용
- Studio 실제 지출
- Outdoor Snap 예상 비용
- Outdoor Snap 실제 지출
- 전체 Category 합계

이를 위해 Budget Item에 선택적으로 Section 정보를 둘 수 있다.

예:

```text
STUDIO
OUTDOOR_SNAP
```

---

## 17. 메이크업

기본 Budget Item:

- 본식 신부 헤어메이크업
- 신랑 헤어메이크업
- 얼리/레이트 스타트 비용
- 혼주 헤어메이크업
- 웨딩 네일
- 웨딩 케어

### 필수

- 본식 신부 헤어메이크업
- 신랑 헤어메이크업

### 선택

- 혼주 헤어메이크업
- 웨딩 네일
- 웨딩 케어

---

## 18. 예복·혼주

기본 Budget Item:

- 신랑 예복
- 신랑 예복 대여비
- 혼주 정장
- 혼주 한복

각 비용은 독립적으로 예산 / 예상 비용 / 실제 지출을 관리한다.

---

## 19. 예단·예물

기본 Budget Item:

- 웨딩밴드
- 부모님 예단
- 기타 예물

### 필수

- 웨딩밴드

### 선택

- 부모님 예단
- 기타 예물

부모님 예단과 기타 예물은 초기 예산을 0원으로 둘 수 있다.

---

## 20. 교통·하객지원

기본 Budget Item:

- 대절버스
- 기사님 식대/수고비
- 주차비
- 통행료
- 장거리 하객 숙박
- 기타 교통비

대절버스에는 필요할 경우 다음 부가정보를 저장할 수 있어야 한다.

- 출발지
- 도착지
- 버스 대수
- 버스 인승
- 편도 / 왕복
- 업체
- 연락처
- 출발 시간
- 복귀 시간
- 비고

향후 전세버스 업체별 견적 비교 기능과 연결할 수 있는 구조를 고려한다.

---

## 21. 기타 준비

기본 Budget Item:

- 양가 인사/선물
- 상견례 비용
- 청첩장
- 모바일 청첩장
- 식권
- 방명록
- 답례품
- 혼주 꽃/코사지
- 폐백
- 지인 사례비
- 기타

청첩장 모임 비용은 이 Category에 포함하지 않는다.

---

## 22. 예비비

예비비는 독립된 Budget Category로 관리한다.

예상하지 못한 비용이 발생했을 때만 사용하는 것을 목적으로 한다.

Dashboard에서는 다음 정보를 제공한다.

- 예비비 배정 금액
- 예비비 사용 금액
- 예비비 잔액

---

## 23. 청첩장 모임

청첩장 모임은 Wedding 본예산과 완전히 별도로 관리한다.

독립된 메뉴와 페이지를 제공한다.

### 상단 요약

- 목표 예산
- 예상 총비용
- 실제 지출
- 남은 예산
- 총 모임 횟수
- 총 참석 인원
- 1인당 평균 비용

### Invitation Meeting

각 모임은 다음 데이터를 가진다.

- 모임명
- 구분
- 날짜
- 장소
- 참석 예정 인원
- 실제 참석 인원
- 예상 비용
- 실제 비용
- 1인당 비용
- 결제자
- 결제 상태
- 비고

### 모임 구분

- 회사
- 대학
- 고등학교
- 교회
- 친구
- 가족
- 기타

### 1인당 비용

```text
실제 비용 / 실제 참석 인원
```

실제 참석 인원이 0명 또는 null인 경우 계산하지 않는다.

### 추가 통계

구분별 다음 정보를 제공한다.

- 모임 횟수
- 참석 인원
- 실제 지출
- 평균 1인당 비용

---

## 24. 신혼여행

MVP에서는 신혼여행 상세 관리 기능을 구현하지 않아도 된다.

Dashboard 또는 별도 메뉴에 다음 상태만 표시한다.

```text
신혼여행 예산 별도 관리
```

향후 다음 항목을 관리할 예정이다.

- 항공권
- 숙박
- 현지 교통
- 식비
- 티켓/관광
- 쇼핑
- 여행자 보험
- 기타

---

## 25. Vendor

향후 웨딩 업체를 관리하기 위한 Vendor Domain을 고려한다.

지원 예정 업체 Category:

- 웨딩홀
- 드레스샵
- 메이크업샵
- 스튜디오
- 야외 스냅
- 본식 스냅
- DVD
- 예복
- 웨딩밴드
- 전세버스
- 기타

Vendor 기본 정보:

- 업체명
- 업체 Category
- 연락처
- URL
- 담당자
- 주소
- 메모

---

## 26. Quote

하나의 Vendor는 여러 개의 Quote를 가질 수 있다.

Quote 기본 정보:

- 업체
- 견적일
- 기본금
- 할인금액
- 추가비용
- 최종 예상금액
- 포함사항
- 제외사항
- 유효기간
- 메모

동일 업체의 여러 견적과 동일 Category에 속한 여러 업체의 견적을 비교할 수 있어야 한다.

---

## 27. 향후 웨딩홀 견적 비교

웨딩홀 Quote에서는 추후 다음 데이터를 관리할 수 있도록 고려한다.

- 대관료
- 꽃장식
- 필수 부대비용
- 1인 식대
- 보증 인원
- 예상 참석 인원
- 최소 식대
- 할인
- 첫 타임 할인
- 비수기 할인
- 당일 계약 혜택
- 기타 추가비용

단순 대관료가 아니라 **실질 예상 총비용**을 계산할 수 있도록 확장할 예정이다.

```text
실질 예상 총비용
= 대관료
+ 필수 옵션
+ 예상 식대
- 할인
```

---

## 28. 전체 예산 계산 규칙

### 전체 계약/예상 비용

```text
모든 Budget Item 계약/예상 비용의 합
```

식대는 `WeddingMealCost`, 청첩장 모임은 `InvitationMeeting`으로 별도 관리하므로 처음부터 Budget Item 합계에 포함되지 않는다. 신혼여행 상세 비용은 MVP에서 관리하지 않는다.

### 전체 실제 지출

```text
모든 Budget Item 실제 지출의 합
```

### 남은 목표 예산

```text
목표 예산 - 전체 계약/예상 비용
```

### 전체 사용률

```text
전체 계약/예상 비용 / 목표 예산
```

Backend를 Budget 계산의 Source of Truth로 사용한다.

전체 및 Category 집계 결과는 DB에 중복 저장하지 않는다.

---

## 29. Budget Warning

### Category Warning

- 사용률 80% 이상: `예산의 80% 이상을 사용했습니다.`
- 사용률 100%: `카테고리 예산을 모두 사용했습니다.`
- 사용률 100% 초과: `카테고리 예산을 초과했습니다.`

### 전체 Budget Warning

- 목표 예산 초과: `목표 예산을 초과했습니다.`
- 최대 예산 초과: `최대 예산을 초과했습니다.`

### Budget Item Warning

```text
계약/예상 비용 > 항목 예산
```

이면 예산 초과 상태로 표시한다.

---

## 30. UX / UI 요구사항

웨딩 서비스의 분위기는 유지하되 기업용 ERP처럼 딱딱한 디자인은 피한다.

반대로 지나치게 유아틱하거나 핑크색 중심의 디자인도 피한다.

전체적으로 깔끔하고 밝은 Wedding Planner 스타일을 지향한다.

- 밝은 배경
- 넉넉한 여백
- Card 기반 Dashboard
- 적당한 Border Radius
- 명확한 Typography
- 숫자 가독성 우선
- Mobile First 또는 Responsive Design
- 예산 초과 상태를 쉽게 확인 가능
- Desktop / Mobile 모두 사용 가능

금액은 천 단위 구분을 적용한다.

예:

```text
2,000,000원
```

---

## 31. PWA

서비스는 모바일에서도 자주 사용할 가능성이 높으므로 PWA를 지원한다.

목표:

- 스마트폰 브라우저에서 정상 사용
- 홈 화면 추가 가능
- 앱과 유사한 실행 경험
- Responsive UI

초기 MVP에서는 Offline 기능을 복잡하게 구현할 필요는 없다.

향후 필요하면 Capacitor 등을 이용해 iOS / Android 앱으로 확장할 수 있다.

---

## 32. 화면 구성

MVP Navigation은 다음과 같이 구성한다.

1. Dashboard
2. 웨딩홀
3. 비교
4. 웨딩 예산
5. 청첩장 모임
6. 업체 / 견적
7. 설정

초기 우선순위는 **웨딩홀 암행투어 및 비교 기능**이다.

---

# Venue Tour MVP

## 33. Venue Tour 목표

웨딩홀 후보를 직접 방문하고 비교하기 위한 기능을 제공한다.

이 기능은 모바일 현장 사용을 우선 고려하며, 사용자는 웨딩홀 방문 중 평가 내용을 즉시 기록할 수 있어야 한다.

초기 MVP에서는 특히 다음 방문 유형을 지원한다.

- 암행투어
- 실제 상담

향후:

- 재방문
- 계약 방문
- 시식
- 최종 점검

으로 확장할 수 있다.

---

## 34. Venue

웨딩홀 후보는 Venue로 관리한다.

Venue 기본 정보:

- 이름
- 주소
- 웹사이트 URL
- 대표 전화번호
- 메모
- 후보 상태

후보 상태:

- 관심
- 방문 예정
- 후보
- 보류
- 탈락
- 계약

하나의 Venue에는 여러 번의 Visit가 존재할 수 있다.

```text
Venue
 ├─ 1차 암행투어
 ├─ 2차 공식 상담
 ├─ 3차 재방문
 └─ 계약
```

기존 방문 기록은 새로운 방문 기록으로 덮어쓰지 않는다.

---

## 35. Venue Visit

Venue 방문 기록은 VenueVisit으로 관리한다.

VenueVisit 기본 정보:

- Venue
- 방문 유형
- 방문 날짜
- 방문 시간
- 예상 가격
- 가격 정보 출처
- 좋았던 점
- 아쉬운 점
- 한줄 총평
- 상세 총평
- 재방문 의향
- 후보 상태
- 방문 완료 여부

방문 유형:

- SECRET_TOUR
- CONSULTATION
- REVISIT
- CONTRACT
- OTHER

가격 정보 출처:

- 미확인
- 인터넷 참고
- 지인 정보
- 상담 견적
- 계약 견적

재방문 의향:

- 높음
- 보통
- 낮음
- 없음

---

## 36. Venue Evaluation

각 VenueVisit에서는 여러 평가 항목을 기록할 수 있다.

각 평가 항목은 다음 정보를 가진다.

- 평가 Category
- 별점
- 이유 / 메모
- 평가 여부
- 중요도
- 정렬 순서

평가 상태는 다음처럼 구분한다.

- `UNRATED`: 아직 작성하지 않음
- `RATED`: 평가 완료, 별점 필수
- `NOT_OBSERVED`: 의도적으로 미확인, 별점 없음

별점은 1점부터 5점까지 지원한다.

평가하지 못한 항목은 반드시 `미확인` 상태로 둘 수 있어야 한다.

미작성과 미확인은 작성 진행률을 위해 구분하며, 두 상태 모두 평균 점수 계산에서는 제외한다.

예:

```text
홀 디자인
별점: 5
이유: 실제 꽃장식이 사진보다 풍성하고 색감이 마음에 들었다.
```

---

## 37. 기본 Venue 평가 항목

### Hall

- 홀 디자인
- 꽃장식
- 버진로드
- 조명
- 음향
- 하객 시야
- 실제 수용감

### 신부대기실

- 디자인
- 크기
- 채광
- 사진 촬영 환경
- 하객 동선

### 접근성

- 대중교통 접근성
- 역에서 실제 이동 편의
- 건물 찾기 쉬움
- 지방 하객 접근성

### 주차

- 차량 진입 동선
- 주차 공간
- 출차 편의
- 혼주 주차
- 대절버스 주차 가능성

### 하객 동선

- 로비 크기
- 로비 혼잡도
- 다른 예식과 동선 겹침
- 엘리베이터 대기
- 축의대 공간

### 연회장

- 연회장 동선
- 테이블 간격
- 좌석 확보
- 혼잡도
- 음식 상태
- 음식 종류
- 음식 리필 상태

### 운영

- 예식 간격
- 직원 응대
- 안내 상태
- 화장실
- 건물 청결도

### 가격

- 가격 만족도
- 비용 대비 만족도

각 항목은 사용자가 자유롭게 추가 / 수정 / 삭제할 수 있어야 한다.

---

## 38. Venue 총평

각 VenueVisit에는 정량 평가 외에 정성적인 총평을 기록할 수 있어야 한다.

### 좋았던 점

복수 문장 또는 목록 형태로 기록할 수 있다.

### 아쉬운 점

복수 문장 또는 목록 형태로 기록할 수 있다.

### 한줄 총평

예:

```text
가격만 맞으면 바로 계약하고 싶은 홀
```

### 상세 총평

방문 이후 느낀 점을 자유롭게 기록한다.

---

## 39. Venue 가격 정보

가격은 별점과 별개의 수치 데이터로 관리한다.

VenueVisit에서 최소 다음 값을 입력할 수 있어야 한다.

- 대관 및 필수 부대비용
- 1인 식대
- 보증 인원
- 예상 참석 인원
- 예상 식대
- 기타 추가비용
- 할인금액
- 최종 예상 비용

암행투어 단계에서 가격 정보가 없는 경우 모든 가격 필드는 비워둘 수 있다.

입력한 가격 정보는 VenueVisit 시점의 스냅샷이다. 예상 식대와 최종 예상 비용은 중복 저장하지 않고 입력값으로부터 계산한다.

### 예상 식대

```text
적용 인원 = 입력된 보증 인원과 예상 참석 인원 중 큰 값
예상 식대 = 적용 인원 × 1인 식대
```

두 인원이 모두 비어 있으면 적용 인원과 예상 식대는 `null`이다.

### 최종 예상 비용

```text
최종 예상 비용
= 대관 및 필수 부대비용
+ 예상 식대
+ 기타 추가비용
- 할인금액
```

계산에 필요한 값이 부족한 경우 결과를 임의로 0원 처리하지 않고 `null`로 반환한다.

---

## 40. Venue 평균 점수

VenueVisit의 `RATED` 평가 항목을 기준으로 평균 점수를 계산한다.

미작성 및 미확인 항목은 평균에서 제외한다. 평가 완료 항목이 하나도 없으면 평균 점수는 `null`이다.

```text
평가 완료 항목:
5, 4, 4, 미확인, 3

평균:
(5 + 4 + 4 + 3) / 4
= 4.0
```

향후 평가 Category별 가중치를 지원할 수 있는 구조를 고려한다.

---

## 41. Venue 가중치 평가

향후 사용자 개인의 우선순위를 반영할 수 있도록 평가 항목별 가중치를 지원할 수 있다.

예:

```text
홀 디자인       1.5
예식 간격       1.5
접근성           1.2
가격             1.3
주차             1.0
```

가중 점수 계산 기능은 MVP 이후 구현 가능하다.

---

## 42. Venue 목록 화면

Route 예시:

```text
/venues
```

각 Venue Card에서 최소 다음 정보를 확인한다.

- Venue 이름
- 최근 방문일
- 현재 후보 상태
- 최근 방문 평균 점수
- 최근 예상 가격 또는 견적
- 한줄 총평
- 방문 횟수

기능:

- Venue 추가
- Venue 상세보기
- 새로운 방문 기록 추가
- 비교 대상으로 선택
- 후보 상태 변경

---

## 43. Venue 방문 입력 화면

Route 예시:

```text
/venues/{venueId}/visits/new
```

현장에서 모바일로 빠르게 입력할 수 있어야 한다.

화면 구성:

1. Venue 정보
2. 방문 유형
3. 방문 날짜
4. 가격 정보
5. 평가 항목
6. 좋았던 점
7. 아쉬운 점
8. 한줄 총평
9. 상세 총평
10. 후보 상태
11. 저장

평가 UI 예시:

```text
홀 디자인

☆ ☆ ☆ ☆ ☆

[미확인]

이유 / 메모
[                              ]
```

필수 입력을 최소화한다.

---

## 44. Mobile Venue UX

Venue Tour 기능은 모바일 사용성을 최우선으로 한다.

- 큰 별점 버튼
- 큰 Checkbox / Toggle
- 충분한 Touch Area
- 한 손 입력 가능
- 긴 메모 입력 가능
- 저장 버튼 접근성 확보
- 평가 완료 진행률 표시
- 미확인 항목만 보기
- 미작성 항목만 보기
- Section 접기 / 펼치기
- 입력 중 데이터 유실 방지

초기 MVP에서 Offline 동기화는 필수가 아니다.

---

## 45. Venue 상세 화면

Route 예시:

```text
/venues/{venueId}
```

표시 정보:

- Venue 기본 정보
- 현재 후보 상태
- 평균 점수
- 최근 예상 비용
- 방문 이력
- 방문별 총평
- 방문별 평가
- 방문별 가격 정보

방문 기록은 시간순으로 확인한다.

---

## 46. Venue 비교

Route 예시:

```text
/venues/compare
```

최소 2개 이상의 Venue를 선택하여 비교할 수 있다.

Desktop에서는 Table 형태를 기본으로 한다.

비교 항목:

- 예상 비용
- 홀 디자인
- 신부대기실
- 접근성
- 주차
- 하객 동선
- 예식 간격
- 가격 만족도
- 전체 평균
- 한줄 총평
- 후보 상태

미확인 값은 점수 0으로 처리하지 않고 `-` 또는 `미확인`으로 표시한다.

---

## 47. Venue 비교 상세 이유

점수뿐 아니라 평가 이유를 함께 확인할 수 있어야 한다.

Desktop에서는 Cell 클릭 또는 Expand 방식으로 제공할 수 있다.

예:

```text
Venue A
주차 ★★★☆☆

주차 공간 자체는 괜찮지만
진입로가 복잡하고 출차 정체가 걱정됨.
```

---

## 48. Mobile Venue 비교

모바일에서는 가로로 넓은 Table을 강제하지 않는다.

Venue Card를 좌우 Swipe 또는 이전/다음 버튼으로 넘길 수 있어야 한다.

```text
        Venue A

       ★ 4.3 / 5

< 이전               다음 >

예상 비용
7,800,000원

홀 디자인
★★★★★

접근성
★★★★☆

좋았던 점
...

아쉬운 점
...

한줄 총평
...
```

---

## 49. 암행투어 Checklist

별점 평가와 별도로 단순 확인 항목을 Checklist 형태로 관리할 수 있다.

예:

- 실제 예식 진행 상황 확인
- 로비 혼잡도
- 엘리베이터 대기
- 버스 주차 위치
- 신부대기실
- 연회장
- 화장실
- ATM
- 다른 홀 하객 동선

Checklist Item 상태:

- 미확인
- 확인
- 해당 없음

Checklist Item에는 메모를 기록할 수 있다.

---

## 50. 실제 상담 Checklist

공식 상담 시 사용할 수 있는 기본 Checklist Template을 제공한다.

### 날짜 / 시간

- 가능한 날짜
- 가능한 시간
- 첫 타임 가능 여부
- 예식 간격

### 비용

- 대관료
- 꽃장식
- 필수 부대비용
- 1인 식대
- 보증 인원
- 최소 보증 인원

### 할인

- 첫 타임 할인
- 비수기 할인
- 잔여 타임 할인
- 당일 계약 할인
- 제휴 할인
- 추가 협의 가능 여부

### 계약

- 계약금
- 중도금
- 잔금
- 결제 일정
- 카드 결제
- 취소 규정
- 날짜 변경 규정

### 본식

- 리허설 시간
- 신부대기실 사용 시간
- 본식 진행 시간
- 2부 가능 여부
- 결혼예배 가능 여부
- 외부 사회자 가능 여부
- 축가 가능 여부

### 외부 업체

- 본식 스냅 지정 여부
- DVD 지정 여부
- 아이폰 스냅 가능 여부
- 외부 스냅 가능 여부
- 외부 답례품 가능 여부

### 하객

- 무료 주차 시간
- 혼주 주차
- 신랑신부 주차
- 대절버스 주차
- 셔틀 여부

### 기타

- 시식
- 혼주 식사
- 폐백
- 포토테이블
- 식전 영상

각 항목에는 상담 답변과 메모를 기록할 수 있어야 한다.

---

## 51. Checklist Template

Checklist는 Template 기반으로 생성한다.

기본 Template:

- 암행투어
- 실제 상담

사용자가 VenueVisit 생성 시 방문 유형에 맞는 Template을 선택하면 기본 Checklist가 자동 생성된다.

사용자는 생성된 Checklist Item을 자유롭게 추가 / 수정 / 삭제할 수 있다.

향후 Template 자체를 사용자 정의할 수 있도록 확장 가능성을 고려한다.

---

## 52. 로그인 / Couple Workspace

최종적으로는 커플이 같은 Wedding 데이터를 함께 확인하고 수정할 수 있어야 한다.

단, Venue Tour 초기 MVP에서는 로그인 기능을 필수 구현 범위에서 제외할 수 있다.

향후 구조:

```text
User
 └─ CoupleWorkspace
      ├─ Member
      ├─ Wedding
      ├─ Venue
      ├─ Budget
      ├─ Checklist
      └─ InvitationMeeting
```

초기 권한 예시:

- OWNER
- MEMBER

향후 지원 기능:

- 회원가입 / 로그인
- 커플 초대
- 초대코드 또는 초대링크
- 동일 Workspace 데이터 공동 조회
- 동일 Workspace 데이터 공동 수정
- 사용자별 권한

Venue, Budget 등의 데이터 모델은 향후 Workspace에 귀속시키기 어렵지 않도록 설계한다.

---

## 53. Domain Model

MVP에서 실제 Entity로 구현할 후보:

```text
Venue
 └─ VenueVisit
     ├─ VenueEvaluation
     └─ ChecklistItem

Wedding
 ├─ BudgetCategory
 │   └─ BudgetItem
 ├─ WeddingMealCost
 └─ InvitationMeeting
```

`VenuePrice`는 VenueVisit에 포함되는 값 타입으로 관리한다. `Checklist`와 Template 정의는 MVP에서 별도 Entity로 만들지 않고, 기본 Catalog를 VenueVisit의 `ChecklistItem`으로 복사한다.

Enum 또는 값 타입 후보:

- `CandidateStatus`
- `VisitType`
- `PriceSource`
- `RevisitIntent`
- `EvaluationCategory`
- `EvaluationStatus`
- `ChecklistType`
- `ChecklistStatus`
- `ItemImportance`
- `PaymentStatus`
- `PayerType`

후속 기능을 구현할 때 추가할 Entity 후보:

- `Payment`, `Payer`, `ExpenseShare`
- `Vendor`, `Quote`
- `User`, `CoupleWorkspace`, `WorkspaceMember`

상세 책임, 관계, 확장 시점은 `ARCHITECTURE.md`를 따른다.

원칙:

- 불필요한 Entity 분리 금지
- 불필요한 양방향 연관관계 금지
- 중복 데이터 최소화
- 핵심 비즈니스 규칙 명확화
- 향후 기능 추가 가능
- 과도한 추상화 방지

---

## 54. REST API

예시:

```http
GET /api/v1/venues
POST /api/v1/venues
GET /api/v1/venues/{venueId}
PATCH /api/v1/venues/{venueId}

GET /api/v1/venues/{venueId}/visits
POST /api/v1/venues/{venueId}/visits
GET /api/v1/venues/{venueId}/visits/{visitId}
PATCH /api/v1/venues/{venueId}/visits/{visitId}

PUT /api/v1/venues/{venueId}/visits/{visitId}/evaluations
PUT /api/v1/venues/{venueId}/visits/{visitId}/checklist-items

GET /api/v1/venues/compare?ids=1,2,3

POST /api/v1/weddings
GET /api/v1/weddings/{weddingId}
PATCH /api/v1/weddings/{weddingId}
GET /api/v1/weddings/{weddingId}/dashboard

GET /api/v1/weddings/{weddingId}/budget-categories
POST /api/v1/weddings/{weddingId}/budget-categories
PATCH /api/v1/weddings/{weddingId}/budget-categories/{categoryId}
DELETE /api/v1/weddings/{weddingId}/budget-categories/{categoryId}

POST /api/v1/weddings/{weddingId}/budget-categories/{categoryId}/items
PATCH /api/v1/weddings/{weddingId}/budget-items/{itemId}
DELETE /api/v1/weddings/{weddingId}/budget-items/{itemId}

GET /api/v1/weddings/{weddingId}/meal-cost
PUT /api/v1/weddings/{weddingId}/meal-cost

GET /api/v1/weddings/{weddingId}/invitation-meetings
POST /api/v1/weddings/{weddingId}/invitation-meetings
PATCH /api/v1/weddings/{weddingId}/invitation-meetings/{meetingId}
DELETE /api/v1/weddings/{weddingId}/invitation-meetings/{meetingId}
```

현장 입력에서는 평가와 Checklist Item을 일괄 저장하여 자식 Row마다 네트워크 요청을 보내지 않는다.

URI에 포함된 부모/자식 ID가 실제 소속 관계와 일치하는지 Backend에서 검증한다.

---

## 55. Seed Data

개발 직후 실제 UI를 확인할 수 있도록 기본 Seed Data를 제공한다.

- 기본 Budget Category
- 기본 Budget Item
- 기본 Venue Evaluation Category
- 암행투어 Checklist Template
- 실제 상담 Checklist Template

기본 Evaluation/Checklist/Budget Catalog와 Local/Dev 환경의 샘플 Venue 데이터는 구분한다. 애플리케이션 재시작 시 기존 사용자 데이터를 덮어쓰지 않는다.

---

## 56. Validation

다음 값을 검증한다.

- 금액 < 0 금지
- 목표 예산 <= 0 금지
- 최대 예산 <= 0 금지
- 참석 인원 < 0 금지
- 버스 대수 < 0 금지
- 별점은 1~5 범위
- 미확인 평가의 점수 강제 금지
- 유효하지 않은 결혼식 날짜 방지
- 존재하지 않는 Category 접근 방지
- 존재하지 않는 Item 접근 방지
- 존재하지 않는 Venue 접근 방지
- 존재하지 않는 Visit 접근 방지
- 삭제된 데이터 참조 방지
- division by zero 방지

Backend Validation 및 전역 Exception Handling을 적용한다.

---

## 57. 테스트

핵심 Business Logic에는 Unit Test를 작성한다.

최소 테스트 범위:

### Budget

- Category 예상 비용 합계
- Category 실제 지출 합계
- 전체 예상 비용 계산
- 전체 실제 지출 계산
- 식대 제외 계산
- 잔여 예산 계산
- 사용률 계산
- 목표 예산 초과 판정
- 최대 예산 초과 판정
- Budget Item 예산 초과 판정

### Invitation Meeting

- 1인당 비용 계산
- 참석 인원 0명일 때 division by zero 방지

### Venue

- VenueVisit 평균 점수 계산
- 미확인 항목 평균 제외
- 모든 항목 미확인일 때 처리
- 1~5점 Validation
- 보증 인원과 예상 참석 인원을 반영한 예상 식대 계산
- 가격 정보가 부족할 때 계산 결과 null 처리
- 최종 예상 비용 계산
- Venue 비교 데이터 집계

Controller E2E 테스트보다 핵심 Domain / Service Test를 우선한다.

---

## 58. 개발 원칙

### Backend

- Controller에 Business Logic을 작성하지 않는다.
- Entity를 API Response로 직접 반환하지 않는다.
- DTO를 사용한다.
- Transaction Boundary를 명확하게 관리한다.
- N+1 문제를 고려한다.
- 무분별한 EAGER Loading을 피한다.
- 무분별한 양방향 연관관계를 피한다.
- 삭제 정책을 명확하게 정의한다.
- 날짜와 시간 타입을 적절하게 구분한다.
- 핵심 계산 로직은 한 곳에서 관리한다.

### Money

금액 계산에 Floating Point 타입을 사용하지 않는다.

MVP는 원화만 취급하므로 금액은 Java `long`, DB `BIGINT`에 원 단위 정수로 저장한다. 평균 점수와 사용률처럼 나눗셈이 필요한 계산은 Java `BigDecimal`을 사용한다.

다중 통화는 신혼여행 등 실제 요구가 생기는 시점에 별도 `Money` 값 타입으로 확장한다. 선택 이유와 Trade-off는 `ARCHITECTURE.md`에 기록한다.

### Frontend

- Server State와 UI State를 구분한다.
- 금액 Formatting 로직을 공통화한다.
- API Error를 사용자에게 이해 가능한 방식으로 표시한다.
- Mobile 환경에서도 입력이 편해야 한다.
- Venue Tour 입력 화면은 Mobile First로 설계한다.

---

## 59. README

README에는 최소 다음 내용을 포함한다.

- 프로젝트 소개
- 개발 배경
- 주요 기능
- 기술 스택
- 실행 방법
- DB 설정
- 주요 Domain 설명
- ERD
- API 구조
- 예산 계산 규칙
- Venue 평가 계산 규칙
- 주요 기술적 의사결정
- 향후 개발 계획

---

## 60. Architecture 문서

`ARCHITECTURE.md`에는 다음 내용을 기록한다.

- 전체 Architecture
- Backend Package 구조
- Frontend 구조
- Domain 관계
- ERD
- 금액 타입 선정 이유
- Business Logic 책임
- Transaction Boundary
- 삭제 정책
- Venue / Vendor 관계
- VenueVisit / Quote 관계
- Checklist / Evaluation 분리 여부
- Evaluation Category를 Enum 또는 DB로 관리하는 이유
- 향후 CoupleWorkspace 도입 전략
- 주요 기술 선택과 Trade-off

중요한 설계 변경은 문서에 기록한다.

---

## 61. 구현 단계

### Phase 0 — Venue Tour MVP

- Backend / Frontend 초기 설정
- MySQL 연결
- Venue
- VenueVisit
- VenueEvaluation
- 암행투어 입력
- Venue 상세
- Venue 비교
- 기본 Checklist
- Responsive UI
- PWA 기본 설정

### Phase 1 — Wedding Foundation

- Wedding
- 결혼식 날짜
- 목표 예산
- 최대 예산
- 설정

### Phase 2 — Budget Backend

- BudgetCategory
- BudgetItem
- Seed Data
- Budget 계산
- Dashboard API
- Unit Test

### Phase 3 — Budget Frontend

- Dashboard
- Budget Category UI
- Budget Item CRUD
- Progress Bar
- Budget Warning

### Phase 4 — Invitation Meeting

- 청첩장 모임 CRUD
- 비용 계산
- 통계

### Phase 5 — Payment / Payer

- 결제 상태
- 결제자
- 부담액 통계

### Phase 6 — Vendor / Quote

- Vendor
- Quote
- 견적 비교
- VenueVisit 연결

### Phase 7 — Authentication / Couple Workspace

- User
- 로그인
- CoupleWorkspace
- 커플 초대
- 권한

각 Phase가 완료된 시점에는 애플리케이션이 정상적으로 실행 가능한 상태를 유지해야 한다.

---

## 62. Venue Tour MVP 완료 기준

다음 흐름이 실제로 동작해야 한다.

1. Venue 등록
2. Venue 목록 조회
3. 암행투어 Visit 생성
4. 평가 항목 별점 입력
5. 평가 이유 입력
6. 미확인 상태 입력
7. 좋았던 점 기록
8. 아쉬운 점 기록
9. 한줄 총평 기록
10. 상세 총평 기록
11. 예상 가격 기록
12. Visit 저장
13. 새로고침 후에도 DB 데이터 유지
14. Venue 상세에서 방문 기록 조회
15. Venue별 평균 점수 확인
16. 2개 이상의 Venue 선택
17. Venue 비교 화면 조회
18. 평가 항목별 점수 비교
19. 평가 이유 확인
20. 모바일에서 Venue별 카드 이동
21. 모바일 환경에서 암행투어 입력 가능
22. PWA 형태로 모바일 브라우저에서 사용 가능

---

## 63. 전체 MVP 완료 기준

1. 결혼식 날짜 설정
2. 목표 예산 설정
3. 최대 예산 설정
4. Dashboard 전체 예산 확인
5. Category별 배정 예산 확인
6. Budget Item 생성 / 수정 / 삭제
7. 항목별 예산 입력
8. 계약/예상 비용 입력
9. 실제 지출 입력
10. Dashboard와 Category 금액 즉시 갱신
11. 결제 상태 확인
12. 결제자 확인
13. 목표 예산 초과 경고
14. 최대 예산 초과 경고
15. 식대 별도 계산
16. 청첩장 모임 별도 등록
17. 청첩장 모임 총비용 계산
18. 청첩장 모임 1인당 비용 계산
19. Venue Tour 기능 사용
20. Venue 비교
21. 새로고침 이후에도 DB 데이터 유지
22. PC와 모바일에서 정상 사용
23. PWA 설치 가능

---

## 64. Non-Goals — 초기 MVP에서 하지 않는 것

- MSA
- Kubernetes
- Event Driven Architecture
- 복잡한 CQRS
- 실시간 공동 편집
- 채팅
- 소셜 기능
- AI 추천
- 네이티브 iOS / Android 앱
- 과도한 디자인 시스템
- 복잡한 Offline Sync
- 외부 결제 연동
- 평가 항목 가중치 계산
- DB 기반 사용자 정의 Evaluation/Checklist Template
- 사진 및 견적서 파일 첨부
- 계약금/중도금/잔금별 Payment Entity
- 사용자 정의 Payer와 분담 비율

로그인 및 Couple Workspace는 Venue Tour MVP 이후 단계에서 구현한다.

---

## 65. 최종 원칙

Wedget은 기능 수가 많은 서비스보다,

**실제 결혼 준비 과정에서 유용하게 사용할 수 있고, 핵심 Domain과 Business Logic을 명확하게 설명할 수 있는 서비스**

를 목표로 한다.

특히 다음 영역의 설계 품질을 우선한다.

- Venue / VenueVisit 모델링
- 평가 점수와 평가 이유의 분리
- 미확인 평가 처리
- Venue 비교
- Budget 계산
- 실제 지출과 예상 비용의 분리
- 본예산과 별도 비용의 분리
- Payment 상태
- Payer별 부담액
- Category별 예산 배분
- 예산 초과 판단
- Vendor / Quote 비교 구조
- Couple Workspace 확장 가능성

새로운 기능을 추가할 때 현재 MVP 구조를 불필요하게 복잡하게 만들지 않는 것을 우선한다.
