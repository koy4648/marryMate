# Marry Mate 개발 일지

> 목적: 구현 내용을 외우는 문서가 아니라, 설계 이유와 문제 해결 과정을 내 언어로 설명하기 위한 학습 기록

## 0. 이 문서를 사용하는 방법

면접에서는 파일 개수나 어노테이션 이름보다 다음 세 가지를 설명하는 것이 중요하다.

1. 어떤 사용자 문제를 해결하려 했는가?
2. 여러 구현 방법 중 왜 이 구조를 선택했는가?
3. 구현 중 어떤 문제가 생겼고 어떻게 검증했는가?

아래 내용을 그대로 암기하지 말고, 각 절을 읽은 뒤 코드를 직접 찾아가며 한 번씩 설명해본다. AI 도구를 활용했다면 숨기기보다 "반복 구현은 도구의 도움을 받았고, 도메인 경계·보안 방식·검증 기준을 직접 판단하고 검토했다"고 설명하는 편이 좋다.

---

## 1. 이번 개발의 목표

내일 웨딩홀 현장에서 두 사용자가 각자 휴대폰으로 다음 흐름을 사용할 수 있게 만드는 것이 목표였다.

```text
각자 회원가입
→ 한 사람이 Couple Workspace 초대 코드 생성
→ 다른 사람이 초대 코드로 참가
→ 같은 웨딩홀 후보와 방문 기록 저장
→ 서로 최신 기록 조회
```

현장 인터넷이 불안정할 수 있기 때문에 서버 저장만 의존하지 않고, 작성 중 데이터는 브라우저에도 보관하도록 했다.

```text
작성 중 Draft        → 브라우저 localStorage
완료된 방문 기록     → Spring Boot API → MySQL
네트워크 복구        → 로컬 미전송 기록을 공유 DB로 동기화
```

## 2. 구현 범위와 의도적으로 제외한 범위

### 이번에 구현한 것

- 이메일·비밀번호 회원가입과 로그인
- BCrypt 비밀번호 해싱
- 만료 가능한 불투명 세션 토큰
- Couple Workspace와 구성원 권한 검사
- 일회성 초대 코드
- Workspace 단위 웨딩홀 후보 저장
- Venue Visit 전체 기록 저장·조회·수정
- 로컬 자동 저장과 서버 동기화
- Docker MySQL과 Flyway migration
- 모바일 화면 검증

### 이번에 제외한 것

- 이메일 인증
- 비밀번호 재설정
- Google·Kakao OAuth
- 사진 및 영상 업로드
- 공개 후기와 커뮤니티
- Refresh Token 회전
- 로그인 시도 횟수 제한
- 완성된 관리자 기능

범위를 제한한 이유는 "내일 현장에서 둘이 공동 기록한다"는 핵심 시나리오를 먼저 완성하기 위해서다.

---

## 3. 개발 환경 구성

### Spring Initializr에서 발생한 문제

Initializr가 Spring Boot 4 프로젝트를 생성했지만, 프로젝트 요구사항은 Java 17과 Spring Boot 3이었다. 생성된 코드를 버리기보다 다음 버전을 직접 맞췄다.

```text
Spring Boot  4.1.1  → 3.5.16
Gradle       9.5.1  → 8.14.3
Java target          → 17
```

Spring Boot 4용 세분화된 starter 대신 Boot 3의 일반적인 의존성으로 변경했다.

```groovy
spring-boot-starter-web
spring-boot-starter-data-jpa
spring-boot-starter-validation
spring-boot-starter-security
spring-boot-starter-actuator
flyway-core
flyway-mysql
mysql-connector-j
```

### MySQL을 Docker로 실행한 이유

- 로컬 MySQL 설치 상태와 무관하게 동일한 버전을 사용할 수 있다.
- 팀원이 생겨도 `docker compose up -d`로 같은 환경을 재현할 수 있다.
- Named Volume을 사용해 컨테이너를 내려도 데이터가 유지된다.

주의할 명령:

```bash
docker compose down       # 컨테이너만 종료, 데이터 유지
docker compose down -v    # Volume까지 삭제하므로 DB 데이터 제거
```

---

## 4. Flyway로 DB 구조를 관리한 이유

JPA의 `ddl-auto=create`가 테이블을 자동 생성하게 하지 않고 다음처럼 설정했다.

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
  flyway:
    enabled: true
```

역할 분리는 다음과 같다.

- Flyway: DB 테이블을 생성하고 변경한다.
- JPA Entity: Java 객체와 테이블의 매핑을 정의한다.
- Hibernate validate: Entity와 실제 DB 구조가 일치하는지 애플리케이션 시작 시 검사한다.

적용된 migration:

```text
V1__create_users_and_workspace.sql
V2__create_auth_and_venue_tour.sql
```

Flyway는 `flyway_schema_history`에 버전, 설명, checksum과 성공 여부를 기록한다. 이미 적용된 migration을 수정하면 환경별 스키마가 달라질 수 있으므로, 변경이 필요하면 `V3__...sql`을 추가해야 한다.

---

## 5. 핵심 데이터 모델

### 사용자와 커플 공간

```text
User 1 ── N WorkspaceMember N ── 1 CoupleWorkspace
                                  │
                                  ├── N WorkspaceInvite
                                  └── N VenuePlan
```

`users`에 `workspace_id`를 직접 넣지 않고 `workspace_members` 연결 Entity를 둔 이유:

- 한 사용자가 여러 Workspace에 참여할 수 있다.
- OWNER와 MEMBER 역할을 관계에 저장할 수 있다.
- 가입 시점 같은 관계 자체의 속성을 저장할 수 있다.
- 향후 플래너나 가족 구성원을 추가해도 모델을 다시 만들 필요가 없다.

### Venue와 VenuePlan 분리

```text
Venue                    VenuePlan
공유 가능한 웨딩홀 원본   커플 공간의 후보 상태와 기록
```

후보 상태를 `Venue`에 넣으면 한 커플이 탈락시킨 웨딩홀이 다른 사용자에게도 탈락 상태로 보이게 된다. 따라서 `candidateStatus`는 Workspace 소유인 `VenuePlan`에 둔다.

### 방문 기록

```text
CoupleWorkspace 1 ── N VenuePlan 1 ── N VenueVisit
```

`VenueVisit`에는 작성자와 마지막 수정자를 따로 저장한다.

```text
created_by
last_modified_by
```

둘이 공동으로 수정할 때 누가 최초 작성했고 누가 마지막으로 수정했는지 추적하기 위해서다.

---

## 6. 인증 방식

### JWT 대신 불투명 세션 토큰을 선택한 이유

로그인 성공 시 32바이트 난수 토큰을 만들고, 사용자에게는 원문을 반환한다. DB에는 토큰 원문이 아닌 SHA-256 해시만 저장한다.

```text
브라우저: raw token
API 요청: Authorization: Bearer raw-token
DB: SHA-256(raw-token)
```

서버는 요청 토큰을 다시 해싱해 `auth_sessions.token_hash`와 비교한다.

장점:

- 서버에서 특정 세션을 즉시 폐기할 수 있다.
- DB가 노출돼도 저장된 값만으로 바로 로그인하기 어렵다.
- JWT 서명키와 Refresh Token 조합 없이 MVP를 단순하게 유지한다.

단점:

- 요청마다 세션 테이블 조회가 필요하다.
- 사용자가 많아지면 캐시나 세션 정리 정책이 필요하다.

세션 만료 기간은 현재 30일이다.

### 비밀번호

비밀번호 원문은 저장하지 않는다.

```text
회원가입: password → BCrypt → password_hash 저장
로그인: 입력 password와 password_hash를 BCrypt.matches로 검증
```

### 인증과 인가의 차이

- 인증(Authentication): 이 요청을 보낸 사용자가 누구인지 확인한다.
- 인가(Authorization): 이 사용자가 해당 Workspace 데이터에 접근할 수 있는지 확인한다.

로그인에 성공했다고 모든 Workspace 데이터에 접근할 수 있는 것은 아니다. 모든 Venue API는 `X-Workspace-Id`를 받고 `workspace_members`에서 멤버십을 확인한다.

클라이언트가 보내는 `userId`는 신뢰하지 않는다. 사용자 ID는 인증 토큰으로 확인한 Principal에서 얻는다.

---

## 7. 커플 초대 흐름

```text
OWNER가 초대 생성
→ SecureRandom으로 코드 생성
→ DB에는 SHA-256 해시 저장
→ 원문 코드는 생성 응답에서 한 번 전달
→ 상대방이 코드 제출
→ 서버가 해시 조회
→ 만료·사용 여부 확인
→ workspace_members에 MEMBER 추가
→ 초대 코드를 사용 완료 처리
```

현재 초대 코드는 7일 동안 유효하며 한 번만 사용할 수 있다. 동시에 두 요청이 같은 코드를 사용하는 문제를 막기 위해 초대 코드 조회에 비관적 락을 사용했다.

---

## 8. Venue Visit를 JSON으로 저장한 이유와 한계

`Venue`, `VenuePlan`, 날짜, 방문 유형처럼 검색과 관계에 필요한 필드는 일반 컬럼으로 저장했다. 반면 빠르게 변하는 Checklist와 평가 양식은 `venue_visits.payload` JSON 컬럼에 스냅샷으로 저장했다.

선택 이유:

- 현장 Checklist 구조가 아직 자주 바뀐다.
- 당시 질문과 답변을 그대로 보존할 수 있다.
- 내일 사용할 MVP를 빠르게 완성할 수 있다.

단점:

- 특정 Checklist 응답을 SQL로 집계하기 어렵다.
- DB 제약조건으로 내부 JSON 필드를 엄격히 검증하기 어렵다.
- 공개 후기 검색과 통계를 구현할 때는 일부 필드를 정규화해야 한다.

즉, 모든 데이터를 무작정 JSON으로 저장한 것이 아니라 **안정된 관계와 검색 필드는 컬럼**, **변화가 잦은 방문 양식은 스냅샷 JSON**으로 분리했다.

공개 후기나 통계 요구가 구체화되면 `VenueEvaluation`, `ChecklistAnswer` 등을 별도 테이블로 옮기는 migration을 추가한다.

---

## 9. Local-first 동기화

현장에서는 통신 품질이 일정하지 않기 때문에 다음 전략을 사용했다.

### 작성 중

- 입력 변경을 localStorage Draft에 자동 저장한다.
- 새로고침하거나 화면을 나갔다 돌아와도 작성 중 내용을 복구한다.

### 완료 저장

- 온라인이면 서버 API로 MySQL에 저장한다.
- 실패하면 완료 기록도 우선 localStorage에 남긴다.
- 앱이 다시 포커스를 얻거나 사용자가 새로고침하면 미전송 기록을 서버에 올린다.
- 서버 기록을 다시 조회해 로컬 캐시를 최신화한다.

서버에서 발급한 ID는 숫자 문자열이고, 아직 전송하지 못한 로컬 ID는 UUID다. 동기화 시 이를 구분해 미전송 데이터를 찾는다.

### Source of Truth

- 작성 중 Draft: 현재 기기
- 서버 전송 전 완료 기록: 현재 기기
- 정상 동기화된 완료 기록: MySQL

---

## 10. 구현 중 발생한 문제

### 문제 1: Initializr가 Spring Boot 4만 생성

원인: 생성 시점의 Initializr 기본 버전이 프로젝트 요구사항과 달랐다.

해결:

- Boot plugin을 3.5.16으로 변경
- Gradle Wrapper를 Boot 3 호환 8.14.3으로 변경
- Boot 4 전용 starter를 Boot 3 의존성으로 변경
- Java Toolchain을 17로 유지

### 문제 2: DB가 없어서 Context 테스트 실패

JPA와 Flyway가 DataSource를 만들려고 했지만 처음에는 MySQL 연결 설정이 없었다. Docker MySQL을 실행하고 `.env`를 `application.yaml`에서 import하도록 구성했다.

### 문제 3: Hibernate schema validation 실패

오류 요약:

```text
DB token_hash: CHAR(64)
Entity 예상 타입: VARCHAR(64)
```

해결:

```java
@Column(columnDefinition = "char(64)")
```

DB와 Entity의 타입 의도를 명시적으로 일치시켰다. `ddl-auto: validate`를 사용했기 때문에 배포 전에 이 불일치를 발견할 수 있었다.

### 문제 4: 로컬 서버가 실행 중인데 테스트 요청에서 연결 실패

개발 도구의 격리된 실행 환경 때문에 일반 프로세스와 승인된 프로세스의 네트워크 범위가 달랐다. 같은 실행 권한 범위에서 요청을 다시 실행해 API 자체에는 문제가 없음을 확인했다.

---

## 11. 검증한 시나리오

자동 검증:

```bash
./gradlew test
./gradlew bootJar
pnpm lint
pnpm test
```

실제 API 종단 간 검증:

```text
사용자 A 회원가입                     성공
A의 Workspace 자동 생성              성공
A가 초대 코드 생성                   성공
사용자 B 회원가입                     성공
B가 A의 Workspace 참가               성공
A가 웨딩홀 후보 생성                 성공
A가 Venue Visit 저장                 성공
B가 같은 Workspace의 Venue 조회      성공
B가 같은 Venue Visit 조회            성공
```

프론트 검증:

- 로그인 화면 렌더링
- 로그인 후 공동 작업 카드 표시
- Workspace 선택 UI
- 초대 코드 생성 및 참가 UI
- 서버에 저장된 웨딩홀과 방문 횟수 표시
- 390 × 844 모바일 viewport에서 레이아웃 확인

---

## 12. 현재 남은 작업

코드는 로컬에서 동작하지만, 두 휴대폰이 외부에서 접속하려면 클라우드 배포가 필요하다.

```text
GitHub 로그인 및 Railway 연결
→ Railway MySQL 생성
→ Spring Boot 서비스 배포
→ 공개 HTTPS API 주소 발급
→ Frontend 환경변수에 API 주소 설정
→ Frontend 재빌드·재배포
→ 사이트 접근을 public으로 변경
→ 두 실제 휴대폰으로 최종 테스트
```

현재 배포 완료라고 말하면 안 된다. 로컬 구현과 공동 사용자 API 검증은 완료됐지만, 외부 백엔드 배포는 Railway 로그인 이후 진행해야 한다.

---

## 13. 기술 부채와 개선 방향

1. 로그아웃 API를 추가해 DB 세션도 즉시 폐기한다.
2. 만료된 `auth_sessions`를 주기적으로 정리한다.
3. 로그인 실패 횟수 제한과 감사 로그를 추가한다.
4. 이메일 인증과 비밀번호 재설정을 구현한다.
5. API 통합 테스트를 Testcontainers 기반으로 자동화한다.
6. 동기화 요청에 클라이언트 version을 포함해 충돌 UI를 제공한다.
7. JSON payload 중 검색·통계에 필요한 필드를 정규화한다.
8. 사진은 R2/S3 같은 Object Storage에 저장하고 DB에는 메타데이터만 둔다.
9. 토큰의 브라우저 보관 방식과 XSS 방어를 고도화한다.
10. CORS 허용 Origin을 배포 환경별로 더 엄격히 관리한다.

---

## 14. 면접용 1분 설명

> Marry Mate는 커플이 웨딩홀을 방문하며 객관적인 사실과 주관적인 만족도를 나눠 기록하는 서비스입니다. 첫 MVP에서는 두 사람이 각자 로그인한 뒤 초대 코드로 Couple Workspace에 참여하고 같은 Venue Plan과 Visit을 공유할 수 있게 구현했습니다. 사용자와 Workspace는 다대다 연결 Entity로 모델링해 역할과 가입 시점을 관계에 보관했고, 모든 API에서 인증뿐 아니라 Workspace 멤버십 인가를 수행합니다. 현장 네트워크가 불안정할 수 있어 작성 중 Draft는 브라우저에 자동 저장하고, 완료 기록은 Spring Boot API를 통해 MySQL에 저장하며 연결 복구 시 재동기화하도록 구성했습니다. DB 스키마는 Flyway로 관리하고 JPA는 validate만 사용해 코드와 실제 스키마 불일치를 조기에 발견하도록 했습니다.

## 15. 예상 질문과 답변 포인트

### 왜 MSA가 아니라 Modular Monolith인가?

현재는 한 명이 개발하는 초기 MVP이며 서비스 간 통신과 분산 트랜잭션 비용이 도메인 이점보다 크다. 기능별 패키지 경계를 유지한 모놀리스로 시작하고, 미디어 처리처럼 독립적인 확장 요구가 생기는 기능부터 분리하는 것이 합리적이라고 판단했다.

### 왜 `User`와 `CoupleWorkspace`를 1:1로 연결하지 않았나?

관계에 OWNER/MEMBER 역할과 가입 시간이 필요하며, 장기적으로 플래너나 가족 구성원 참여 가능성이 있다. 따라서 `WorkspaceMember`를 명시적인 연결 Entity로 두었다.

### 왜 JWT를 사용하지 않았나?

MVP에서는 즉시 폐기 가능한 세션이 유용했고 Refresh Token 구조까지 도입하지 않고 단순하게 유지하고 싶었다. 충분히 긴 난수 토큰을 발급하고 DB에는 해시만 저장했다. 트래픽이 커지면 세션 캐시나 JWT 전환을 다시 검토할 수 있다.

### 왜 Checklist를 완전히 정규화하지 않았나?

평가 양식이 아직 빠르게 변하는 단계이고 방문 당시 질문 구조를 스냅샷으로 보존할 필요가 있었다. 대신 Workspace, Venue, 날짜처럼 조회와 권한에 필요한 안정적인 필드는 관계형 컬럼으로 관리했다.

### 동시 수정은 어떻게 처리하나?

`VenueVisit`에 JPA `@Version`을 적용해 겹치는 갱신을 감지할 기반을 만들었다. 현재 UI는 저장 단위가 크므로 후속 단계에서는 version을 응답과 요청에 노출하고, 충돌 시 사용자가 선택할 수 있는 UI가 필요하다.

### localStorage가 Source of Truth인가?

작성 중 Draft와 미전송 기록에 한해서만 임시 Source다. 정상 동기화된 완료 기록의 Source of Truth는 MySQL이다.

---

## 16. 직접 해볼 공부 과제

- [ ] 회원가입 요청이 Controller → Service → Repository → MySQL로 이동하는 과정을 디버거로 따라가기
- [ ] `workspace_members` 행을 직접 조회해 OWNER와 MEMBER 확인하기
- [ ] 잘못된 Workspace ID로 Venue API를 호출해 403 확인하기
- [ ] 만료 시간을 과거로 바꾼 초대 코드가 거절되는지 테스트 작성하기
- [ ] `User.create()`의 이메일 정규화 테스트 작성하기
- [ ] 로그아웃 API를 직접 구현해 세션 행 삭제하기
- [ ] Testcontainers로 MySQL 통합 테스트 환경 만들기
- [ ] `VenueVisit.payload` 중 만족도만 별도 테이블로 분리하는 V3 migration 설계하기

## 17. 관련 커밋

Backend 저장소:

```text
a1b1d57 feat: bootstrap backend database
bdcc1b7 feat: add shared venue tour backend
```

Frontend 저장소:

```text
18f6e03 feat: add couple login and database sync
```
