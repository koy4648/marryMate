# Marry Mate 개발기

> 웨딩홀 현장 기록 MVP를 커플 공동 작업이 가능한 서비스로 확장하고, Spring Boot·MySQL·React를 실제 클라우드 환경에 배포하기까지

## 1. 프로젝트 소개

Marry Mate는 결혼 준비 과정에서 흩어지는 선택과 기록을 한곳에 모으기 위한 웨딩 플래닝 서비스다.

결혼을 준비하며 웨딩홀 정보가 메신저, 메모장, 견적서, 커뮤니티 후기 등에 분산되는 문제를 경험했다. 특히 웨딩홀을 방문하면 짧은 시간 안에 접근성, 주차, 홀, 신부대기실, 하객 동선, 식사, 가격 등을 확인해야 한다. 방문 직후에는 기억나지만 여러 곳을 돌아보면 객관적인 조건과 주관적인 인상이 서로 섞이기 쉽다.

이 문제를 해결하기 위해 첫 번째 기능 모듈로 `Venue Tour MVP`를 만들었다.

```text
웨딩홀 후보 등록
→ 현장 암행투어
→ 객관적인 사실 확인
→ 항목별 만족도와 이유 기록
→ 가격과 최종 판단 정리
→ 여러 웨딩홀 비교
```

초기 프로젝트 이름은 Wedget이었지만, 장기적으로 예산, 계약, 체크리스트, 커플 공동 작업, 후기와 커뮤니티까지 확장하려는 방향에 맞춰 Marry Mate로 변경했다.

---

## 2. MVP 범위 결정

처음부터 전체 웨딩 플랫폼을 구현하지 않았다. 실제 현장에서 가장 먼저 사용할 수 있는 Venue Tour 흐름을 우선했다.

이후 두 사용자가 각자 휴대폰으로 같은 기록을 보고 수정하고 싶다는 요구가 추가되면서 다음 흐름을 MVP에 포함했다.

```text
각자 회원가입
→ 한 사람이 Couple Workspace 생성
→ 초대 코드 생성
→ 다른 사용자가 Workspace 참가
→ 같은 웨딩홀과 방문 기록 공유
```

이번 단계에서 구현한 기능은 다음과 같다.

- 모바일 우선 웨딩홀 암행투어 화면
- 객관적인 Checklist와 주관적인 만족도 분리
- 0.5 단위 Section 만족도와 평가 이유
- 가격과 예상 비용 계산
- 계약 의향, Deal Breaker, 장단점과 총평
- 여러 Venue 비교
- 작성 중 자동 임시 저장
- 이메일·비밀번호 회원가입과 로그인
- Couple Workspace와 일회성 초대 코드
- Workspace 단위 웨딩홀 및 방문 기록 공유
- Docker MySQL과 Flyway Migration
- Spring Boot·MySQL·Frontend 클라우드 배포

의도적으로 제외한 기능은 다음과 같다.

- 이메일 인증과 비밀번호 재설정
- Google·Kakao OAuth
- 사진과 영상 업로드
- 공개 후기와 커뮤니티
- 포인트와 광고
- 관리자 기능
- MSA

기능 개수보다 실제 사용자 흐름과 도메인 경계를 명확히 설명할 수 있는 구조를 우선했다.

---

## 3. 시스템 구조

```text
React + TypeScript + PWA
        │
        │ HTTPS REST API
        ▼
Spring Boot Modular Monolith
        │
        ▼
      MySQL
```

운영 배포 구조는 다음과 같다.

```text
사용자 휴대폰
    │
    ▼
Sites Frontend
    │
    ▼
Railway Spring Boot Backend
    │ Railway 내부 네트워크
    ▼
Railway MySQL + Persistent Volume
```

- Frontend: React, TypeScript, Vinext, PWA
- Backend: Java 17, Spring Boot 3.5.16, Spring Data JPA
- Database: MySQL 8.4
- Schema Migration: Flyway
- Local Infrastructure: Docker Compose
- Backend Hosting: Railway
- Frontend Hosting: Sites
- Source Control: GitHub Monorepo

초기에는 MSA도 검토했지만, 한 명이 개발하는 초기 MVP에서 분산 통신, 서비스별 배포, 장애 추적과 데이터 일관성 비용이 도메인 이점보다 크다고 판단했다. 대신 기능별 패키지 경계를 유지한 Modular Monolith로 시작했다.

---

## 4. 핵심 Domain 모델

### 4.1 User와 CoupleWorkspace

웨딩홀 기록을 사용자 한 명에게 직접 귀속하면 커플 공동 작업을 지원하기 어렵다. 따라서 기록의 소유자를 `CoupleWorkspace`로 정의했다.

```text
User 1 ── N WorkspaceMember N ── 1 CoupleWorkspace
                                  │
                                  ├── N WorkspaceInvite
                                  └── N VenuePlan
```

단순 `@ManyToMany` 대신 `WorkspaceMember`를 연결 Entity로 둔 이유는 관계 자체에 데이터가 필요하기 때문이다.

- `OWNER`, `MEMBER` 역할
- Workspace 참가 시각
- 한 사용자의 복수 Workspace 참여 가능성
- 향후 플래너나 가족 구성원 추가 가능성

이를 통해 사용자가 로그인했다는 사실뿐 아니라, 요청한 Workspace의 구성원인지까지 검사할 수 있다.

### 4.2 Venue와 VenuePlan

웨딩홀 원본과 특정 커플의 후보 상태를 분리했다.

```text
Venue
- 이름
- 주소
- 향후 공개 가능한 공통 정보

VenuePlan
- CoupleWorkspace
- Venue
- 후보 상태
- 비공개 메모
- 방문 기록
```

한 커플이 어떤 웨딩홀을 `REJECTED`로 변경했다고 해서 다른 사용자에게도 탈락한 웨딩홀로 보여서는 안 된다. 따라서 후보 상태는 전역 `Venue`가 아니라 Workspace 소유인 `VenuePlan`에 둔다.

### 4.3 VenueVisit

```text
CoupleWorkspace 1 ── N VenuePlan 1 ── N VenueVisit
```

`VenueVisit`에는 최초 작성자와 마지막 수정자를 별도로 저장한다.

```text
created_by
last_modified_by
```

두 사람이 공동으로 기록할 때 누가 작성하고 마지막으로 수정했는지 추적하기 위해서다. `@Version` 필드도 두어 동시에 수정되는 상황을 감지할 기반을 마련했다.

---

## 5. 객관적인 사실과 주관적인 만족도 분리

평가 모델의 핵심 원칙은 다음과 같다.

```text
객관적인 사실
≠ 주관적인 만족도
≠ 사용자의 최종 판단
```

예를 들면 다음 데이터는 서로 다른 의미를 가진다.

```text
무료 주차 120분         객관적인 사실
주차 만족도 3.5 / 5     주관적인 평가
출차 정체가 걱정됨      평가 이유
주차 때문에 계약 보류   최종 판단
```

Frontend 모델을 다음처럼 분리했다.

- `ChecklistItem`: 현장에서 확인한 사실
- `VenueEvaluation`: Section 만족도와 평가 이유
- `FinalAssessment`: 전체 만족도와 최종 계약 판단

평가 Section은 접근성, 주차, 신부대기실, 홀, 예식 운영, 하객 동선, 연회장, 편의시설로 구성했다.

Checklist 상태도 단순 Boolean으로 처리하지 않았다.

```text
UNANSWERED       아직 작성하지 않음
OBSERVED         실제 확인함
NOT_OBSERVED     확인하지 못함
NOT_APPLICABLE   해당 없음
```

이를 통해 `조건을 충족하지 못함`과 `현장에서 확인하지 못함`을 구분했다.

---

## 6. 점수를 하나로 합치지 않은 이유

Marry Mate는 다음 값을 별도로 보여준다.

```text
조건 충족도
Section 만족도 평균
사용자 전체 만족도
```

예시는 다음과 같다.

```text
조건 충족도          6 / 8, 75%
Section 평균         4.2 / 5
전체 만족도          4.5 / 5
```

조건 충족도는 객관적인 기준이고, Section 평균은 항목별 만족도이며, 전체 만족도는 사용자의 직관적인 최종 판단이다. 데이터가 충분하지 않은 MVP 단계에서 임의의 가중치를 적용하면 설명하기 어려운 추천점수가 만들어진다고 판단했다.

---

## 7. 가격 계산

예상 비용은 다음 공식으로 계산한다.

```text
대관·필수 비용
+ max(보증 인원, 예상 인원) × 1인 식대
+ 추가 비용
- 할인 금액
```

예상 비용은 별도 컬럼으로 저장하지 않고 입력값에서 계산한다. 파생값을 저장하면 입력값 변경 시 저장된 값과 다시 계산한 값이 달라질 수 있기 때문이다.

현재 계산은 Frontend Domain 함수에 있다. 견적과 계약 금액이 Backend의 핵심 데이터가 되는 단계에서는 Backend Calculator로 옮겨 API 기준의 단일 계산 규칙을 만들 예정이다.

---

## 8. Local-first 저장 전략

웨딩홀 현장에서는 네트워크가 불안정할 수 있다. 서버에만 저장하면 긴 기록을 작성하다가 데이터를 잃을 수 있어 Local-first 전략을 사용했다.

```text
작성 중 Draft
→ 브라우저 localStorage

완료 기록
→ Spring Boot API → MySQL

통신 실패
→ localStorage에 우선 보관

통신 복구
→ 공유 DB로 재동기화
```

Frontend는 입력 중인 Draft를 자동 저장한다. 앱이 포커스를 다시 얻거나 사용자가 화면으로 돌아오면 서버와 최신 기록을 동기화한다.

로컬 데이터와 서버 데이터를 구분하기 위해 ID 규칙을 사용했다.

```text
로컬 미전송 데이터 ID    UUID
서버 저장 데이터 ID      숫자 문자열
```

정상 동기화된 완료 기록의 Source of Truth는 MySQL이고, localStorage는 Draft와 미전송 데이터의 임시 Source다.

기존 Wedget 형식의 브라우저 데이터가 존재하면 Marry Mate v2 형식으로 변환하는 마이그레이션도 구현했다.

---

## 9. 인증: JWT 대신 불투명 세션 토큰

로그인에는 JWT 대신 서버 저장형 불투명 세션 토큰을 사용했다.

```text
로그인 성공
→ 32바이트 난수 토큰 생성
→ 브라우저에는 원문 토큰 반환
→ DB에는 SHA-256 해시만 저장
```

API 요청 흐름은 다음과 같다.

```http
Authorization: Bearer {raw-session-token}
```

서버는 전달받은 토큰을 SHA-256으로 해싱해 `auth_sessions.token_hash`와 비교한다.

장점:

- 특정 세션을 서버에서 즉시 폐기할 수 있다.
- DB가 노출돼도 저장된 해시만으로 로그인하기 어렵다.
- JWT 서명키와 Refresh Token 구조 없이 MVP를 단순하게 유지할 수 있다.

단점:

- 요청마다 세션 테이블 조회가 필요하다.
- 트래픽이 커지면 세션 캐시가 필요하다.
- 만료된 세션을 정리하는 작업이 필요하다.

세션 만료 기간은 30일이며, 비밀번호는 BCrypt로 해싱해 원문을 저장하지 않는다.

---

## 10. 인증과 인가

로그인에 성공했다고 모든 Workspace 데이터에 접근할 수 있게 하지 않았다.

Venue API 요청에는 다음 Header가 포함된다.

```http
Authorization: Bearer {sessionToken}
X-Workspace-Id: {workspaceId}
```

Backend는 두 단계를 검사한다.

1. 세션 토큰으로 요청 사용자를 인증한다.
2. 해당 사용자가 요청한 Workspace의 구성원인지 확인한다.

클라이언트가 전달하는 `userId`는 신뢰하지 않고, 사용자 ID는 인증 필터가 만든 Principal에서 얻는다. Workspace ID를 임의로 변경해도 다른 커플의 데이터에 접근할 수 없도록 모든 Venue API에서 멤버십을 확인한다.

---

## 11. 커플 초대 코드

초대 흐름은 다음과 같다.

```text
Workspace 구성원이 초대 생성
→ SecureRandom으로 코드 생성
→ DB에는 코드의 SHA-256 해시 저장
→ 원문 코드는 생성 응답에서 한 번 전달
→ 상대방이 원문 코드 제출
→ 서버가 입력값을 해싱해 조회
→ 만료 및 사용 여부 확인
→ WorkspaceMember 생성
→ 초대 코드 사용 완료 처리
```

현재 초대 코드는 7일 동안 유효하고 한 번만 사용할 수 있다. 동시에 두 요청이 같은 코드를 사용하는 문제를 줄이기 위해 초대 코드 조회에 비관적 락을 사용했다.

---

## 12. Flyway와 JPA 역할 분리

테이블 생성을 Hibernate에 맡기지 않았다.

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
  flyway:
    enabled: true
```

역할은 다음처럼 나눴다.

```text
Flyway
→ 테이블, 인덱스와 FK 생성 및 변경

JPA Entity
→ Java 객체와 DB 테이블 매핑

Hibernate validate
→ 애플리케이션 실행 시 Entity와 Schema 일치 여부 검사
```

적용된 Migration은 다음과 같다.

```text
V1__create_users_and_workspace.sql
V2__create_auth_and_venue_tour.sql
```

주요 테이블:

```text
users
auth_sessions
couple_workspaces
workspace_members
workspace_invites
venues
venue_plans
venue_visits
```

이미 적용한 Migration 파일을 수정하지 않고, 변경이 필요하면 새로운 버전 파일을 추가하는 방식을 사용한다.

---

## 13. 관계형 컬럼과 JSON Snapshot 혼합

`VenueVisit`의 모든 데이터를 완전히 정규화하지 않았다. 검색과 관계에 필요한 안정적인 정보는 컬럼으로 저장하고, 빠르게 변하는 방문 양식은 JSON Snapshot으로 보관했다.

일반 컬럼:

- VenuePlan
- 방문 유형
- 방문 날짜와 시간
- 완료 여부
- 최초 작성자와 마지막 수정자
- Version
- 생성·수정 시각

JSON Payload:

- 가격 입력
- Checklist 응답
- Section 평가와 이유
- 전체 만족도
- 장단점과 총평
- Deal Breaker

장점:

- 질문 구조 변경에 빠르게 대응할 수 있다.
- 방문 당시 양식을 그대로 보존할 수 있다.
- MVP 개발 속도를 높일 수 있다.

단점:

- Checklist 항목별 SQL 검색이 어렵다.
- 통계 작성이 어렵다.
- JSON 내부 데이터에 DB 제약조건을 적용하기 어렵다.

공개 후기와 통계 요구가 구체화되면 `VenueEvaluation`, `ChecklistAnswer` 등 검색에 필요한 데이터를 점진적으로 정규화할 예정이다.

---

## 14. REST API

### Authentication

```http
POST /api/v1/auth/signup
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

### Couple Workspace

```http
GET  /api/v1/workspaces
POST /api/v1/workspaces/{workspaceId}/invites
POST /api/v1/workspaces/join
```

### Venue Plan

```http
POST  /api/v1/venue-plans
GET   /api/v1/venue-plans
GET   /api/v1/venue-plans/{planId}
PATCH /api/v1/venue-plans/{planId}
```

### Venue Visit

```http
POST /api/v1/venue-plans/{planId}/visits
GET  /api/v1/venue-plans/{planId}/visits
PUT  /api/v1/venue-plans/{planId}/visits/{visitId}
```

JPA Entity를 API 응답으로 직접 노출하지 않고, 용도별 요청·응답 객체로 변환했다.

---

## 15. PWA와 모바일 현장 사용

Frontend는 모바일 입력을 우선해 설계했다.

- 큰 입력 버튼과 터치 영역
- Section 접기·펼치기
- 0.5 단위 만족도
- 작성 진행률
- 미작성, 미확인, 해당 없음 구분
- Draft 자동 저장
- 예상 비용 자동 계산
- 핵심 조건과 평가 이유가 포함된 비교 화면
- JSON 기록 백업
- PWA Manifest와 Service Worker

Service Worker는 앱 셸과 방문한 GET 요청을 캐싱한다. 네트워크가 끊겨도 캐시된 화면을 열 수 있지만, DB 동기화는 인터넷 연결이 복구된 후 수행된다.

---

## 16. 구현 중 해결한 문제

### 16.1 Spring Initializr가 Boot 4 프로젝트를 생성

초기 생성 버전은 Spring Boot 4.1.1과 Gradle 9.5.1이었다. 프로젝트 요구사항에 맞춰 다음처럼 조정했다.

```text
Spring Boot 4.1.1 → 3.5.16
Gradle 9.5.1      → 8.14.3
Java Target       → 17
```

Boot 4 전용 Starter를 Boot 3 의존성으로 교체했다.

### 16.2 DB가 없어 Spring Context 테스트 실패

JPA와 Flyway가 DataSource를 만들려고 했지만 처음에는 MySQL이 없어 Context 생성에 실패했다. Docker MySQL을 실행하고 `.env` 기반 DB 설정을 추가했다.

### 16.3 Hibernate Schema Validation 실패

DB의 `token_hash`는 `CHAR(64)`였지만 Entity는 `VARCHAR(64)`로 해석됐다.

```java
@Column(columnDefinition = "char(64)")
```

로 매핑 의도를 명시해 해결했다. `ddl-auto: validate` 덕분에 배포 전에 불일치를 발견할 수 있었다.

### 16.4 Railway 첫 배포 실패

Monorepo 최상위에서 빌드가 실행되어 Railway가 Backend 프로젝트를 찾지 못했다. 빌드 로그에는 Java 파일 대신 README와 설계 문서만 표시됐다.

Railway의 Root Directory를 `/backend`로 설정하고 Dockerfile 빌드를 사용해 해결했다.

### 16.5 운영 CORS 연결

Backend가 정상 실행돼도 Frontend Origin이 허용되지 않으면 브라우저 요청이 차단된다. 운영 Frontend Origin을 명시적으로 허용하고 실제 OPTIONS Preflight 요청으로 Origin, Method와 Header 허용 여부를 확인했다.

---

## 17. 검증

Backend 자동 검증:

```text
Gradle Compile 성공
Spring Context Test 성공
Boot JAR 생성 성공
Flyway V1·V2 적용 성공
Railway /actuator/health → UP
```

Frontend 자동 검증:

```text
Production Build 성공
렌더링 테스트 성공
PWA Manifest 테스트 성공
ESLint 성공
```

수동 API 시나리오:

```text
사용자 A 회원가입
→ A의 Workspace 자동 생성
→ A가 초대 코드 생성
→ 사용자 B 회원가입
→ B가 A의 Workspace 참가
→ A가 웨딩홀 후보 생성
→ A가 VenueVisit 저장
→ B가 같은 Workspace의 Venue와 Visit 조회
```

현재 Backend 자동 테스트는 `contextLoads()` 중심이다. 커플 공유 흐름은 수동 종단 간 검증했으며, 향후 Testcontainers 기반 통합 테스트로 자동화해야 한다.

---

## 18. 배포

배포 과정에서 다음 작업을 수행했다.

1. Backend 멀티스테이지 Dockerfile 작성
2. Railway Health Check 설정
3. GitHub Monorepo 연결
4. Railway Root Directory를 `/backend`로 설정
5. 같은 Railway 프로젝트에 MySQL 추가
6. Backend 환경변수에서 MySQL Reference Variable 사용
7. MySQL Persistent Volume 연결
8. Backend 공개 HTTPS Domain 생성
9. `/actuator/health` 확인
10. 운영 Frontend Origin의 CORS Preflight 확인
11. Frontend에 Railway API 주소 연결
12. Frontend 빌드 및 재배포
13. Sites 접근 정책을 Public으로 전환

운영 주소:

```text
Frontend
https://wedget-venue-tour.koy4648.chatgpt.site

Backend
https://marrymate-production.up.railway.app
```

Frontend는 누구나 로그인 화면에 접근할 수 있지만, 실제 데이터 API는 Marry Mate 인증과 Workspace 멤버십 검사를 통과해야 한다. MySQL은 공개 Domain 없이 Railway 내부 네트워크로만 Backend와 통신한다.

---

## 19. Git Commit 전략

문서, Frontend, Backend, 인증, 동기화와 운영 연결을 기능 단위로 분리했다.

```text
0a1d558 docs: define Marry Mate product direction
59497a3 docs: align venue tour requirements and architecture
9300b96 docs: add venue tour backend implementation guide

8e4eed4 Build local-first venue tour frontend
b7a5144 feat: complete field-ready venue tour MVP
fc54b9a chore: rebrand frontend as Marry Mate

a1b1d57 feat: bootstrap backend database
bdcc1b7 feat: add shared venue tour backend
18f6e03 feat: add couple login and database sync
b7dd971 docs: add backend implementation study log
0edccf1 chore: integrate frontend into monorepo
ef43110 feat: connect frontend to production api
```

---

## 20. AI와 협업한 방식

이 프로젝트에서는 AI를 단순 코드 자동 생성기가 아니라 요구사항 구체화, 설계 대안 비교, 반복 구현과 검증을 가속하는 협업 도구로 사용했다.

직접 수행하고 결정한 부분:

- 결혼 준비 과정에서 사용자 문제 발견
- Product Direction과 기능 우선순위 결정
- 평가 항목과 후기 확장 방향 정의
- Spring Initializr 프로젝트 생성
- Docker와 로컬 MySQL 실행
- Railway 프로젝트, MySQL과 Domain 설정
- 설계와 보안 Trade-off 검토

AI와 함께 진행한 부분:

- Requirements와 Architecture 분석
- Domain 모델 및 Entity 관계 설계
- 설계 문서 정리
- 모바일 Venue Tour Frontend 구현
- Local-first 저장 및 Legacy 데이터 마이그레이션
- 인증, Workspace, Venue Backend 구현 보조
- Flyway Schema와 REST API 구조 작성
- 테스트, 빌드와 CORS 검증
- Railway 배포 오류 분석
- Frontend 배포와 운영 API 연결
- 기능 단위 Git Commit 정리

AI가 작성한 코드를 그대로 사용하는 데서 끝내지 않고, Entity 관계, 인증과 인가 경계, Migration, 저장 전략, 동기화와 기술 부채를 직접 검토하고 설명할 수 있는 상태를 목표로 했다.

---

## 21. 현재 기술 부채

현재 서비스는 MVP로 동작하지만 완성된 상용 서비스 수준의 인증과 운영 기능을 모두 갖춘 것은 아니다.

1. 로그아웃 시 서버 세션 폐기
2. 만료된 세션 자동 정리
3. 로그인과 회원가입 Rate Limit
4. 이메일 인증과 비밀번호 재설정
5. Backend Testcontainers 통합 테스트
6. 동기화 충돌 처리 UI
7. Version을 API 요청과 응답에 노출
8. JSON 중 검색·통계가 필요한 필드 정규화
9. Venue 중복 식별 및 병합 정책
10. 공개 회원가입 Abuse 방지
11. 브라우저 토큰 보관 방식과 XSS 방어 고도화
12. 사진 업로드용 Object Storage
13. 운영 모니터링과 DB Backup 정책

---

## 22. 장기 확장 방향

```text
Venue Tour
→ 상담과 견적
→ 계약
→ 예산과 결제
→ 체크리스트
→ 사진이 포함된 공개 후기
→ Venue 중심 커뮤니티
```

개인 준비 기록인 `VenueVisit`과 공개 후기인 `Review`는 바로 하나의 Entity로 합치지 않는다. 사용자가 공개를 선택하는 시점에 별도의 Review Snapshot을 만드는 방향을 검토한다.

사진은 DB Blob으로 저장하지 않고 Object Storage에 원본을 저장하며, DB에는 파일 위치, 타입, 크기, 순서와 공개 범위 같은 Metadata만 보관할 예정이다.

---

## 23. 면접용 1분 설명

> Marry Mate는 커플이 웨딩홀을 방문하면서 객관적인 사실과 주관적인 만족도를 나눠 기록하고 비교하는 서비스입니다. 현장 네트워크가 불안정할 수 있어 작성 중 Draft는 브라우저에 자동 저장하고 완료 기록은 Spring Boot API를 통해 MySQL에 동기화하는 Local-first 구조를 사용했습니다. 사용자 기록을 개인에게 직접 귀속하지 않고 Couple Workspace 소유로 모델링했으며, WorkspaceMember 연결 Entity를 통해 역할과 가입 시점을 관리합니다. 인증에는 BCrypt 비밀번호와 서버에서 폐기 가능한 불투명 세션 토큰을 사용하고, 모든 Venue API에서 인증 후 Workspace 멤버십을 다시 검사합니다. DB Schema는 Flyway로 관리하고 Hibernate는 validate만 사용했습니다. Backend와 MySQL은 Railway에, Frontend는 Sites에 배포했으며 Health Check와 CORS 연결까지 검증했습니다.

---

## 24. 관련 문서와 코드

- [README](./README.md)
- [Requirements](./REQUIREMENTS.md)
- [Architecture](./ARCHITECTURE.md)
- [Backend 구현 가이드](./BACKEND_HANDOFF.md)
- [개발 일지](./DEVELOPMENT_LOG.md)
- [Frontend Venue Tour](./frontend/app/venues/VenueTourApp.tsx)
- [Frontend Domain](./frontend/app/venues/domain.ts)
- [Frontend API Client](./frontend/app/lib/api.ts)
- [AuthService](./backend/src/main/java/com/marrymate/backend/auth/application/AuthService.java)
- [WorkspaceService](./backend/src/main/java/com/marrymate/backend/workspace/application/WorkspaceService.java)
- [VenuePlanService](./backend/src/main/java/com/marrymate/backend/venue/application/VenuePlanService.java)
- [Flyway V1](./backend/src/main/resources/db/migration/V1__create_users_and_workspace.sql)
- [Flyway V2](./backend/src/main/resources/db/migration/V2__create_auth_and_venue_tour.sql)

