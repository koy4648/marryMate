# Marry Mate V2

> 둘이 함께 비교하고 결정하는 결혼 준비 공간

Marry Mate V2는 준비 항목, 후보 업체, 체크리스트, 견적, 계약, 결제 일정과 실제 사용 금액을 Couple Workspace에서 함께 관리하는 서비스입니다.

## 현재 구현 단계

- 새 V2 프로젝트 기반
- Spring Boot 4, Java 21, MySQL, Flyway
- React 19, TypeScript, Vite
- 이메일·비밀번호 회원가입과 로그인
- Couple Workspace, 초대 코드와 멤버십 권한 검사
- 공유 목표 예산과 계약금·중도금·잔금 저장
- 결제 예정일과 결제 완료 처리
- 웨딩홀·플래너·촬영·스튜디오·본식 준비 체크리스트 20종
- 업체 후보별 견적·실사용액·평점·장단점 비교
- 암행투어·실제 상담·하객 투어 후기 기록
- 준비 일정과 결제 예정일을 합친 월간 캘린더
- 모바일 우선 공동 준비 대시보드
- 모든 화면에 예식일 D-day 표시 및 캘린더 자동 반영
- 원 단위 금액 입력과 천 단위 쉼표 표시
- 준비·업체 비교 견적의 예산노트 자동 연동 (미확정은 항목별 최저 견적)
- 패키지 포함 항목의 총액·계약 결제 공유와 중복 합산 방지
- 계약별 계약금·중도금·잔금 일정 수정 및 실제 납입일 표시
- 신혼여행 포함 여부·예상 축의금 차감 설정
- 공유 공간의 메인 제목·소개 문구 설정

기존 프로토타입은 `feature/backend-rebuild` 브랜치의 `cf286f6` 커밋에 보존되어 있습니다.

## 로컬 실행

환경 파일을 준비합니다.

```bash
cp .env.example .env
```

MySQL을 실행합니다.

```bash
docker compose up -d mysql
docker compose ps
```

백엔드를 실행합니다.

```bash
cd backend
./gradlew bootRun
```

프론트를 실행합니다.

```bash
cd frontend
corepack pnpm install
corepack pnpm dev
```

기본 주소:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Health: `http://localhost:8080/actuator/health`

## 현재 공개 테스트 주소

- Frontend: `https://marry-mate-together.koy4648.chatgpt.site`
- API: Cloudflare Quick Tunnel 사용

Quick Tunnel은 계정 없이 사용하는 임시 연결입니다. Mac mini와 아래 컨테이너가 계속 실행되어야 하며, Tunnel 컨테이너를 새로 만들면 API 주소가 변경될 수 있습니다.

```bash
docker compose --profile quick-tunnel up -d mysql api quick-tunnel
docker compose ps
docker compose logs --tail=50 quick-tunnel
```

정식 운영 시에는 Cloudflare 계정의 Named Tunnel 또는 별도 호스팅 서비스로 전환합니다.

## 검증

```bash
cd backend && ./gradlew test
cd frontend && corepack pnpm lint && corepack pnpm test && corepack pnpm build
```

## 개발 순서

1. 프로젝트와 DB 기반 — 완료
2. 사용자 인증과 Couple Workspace — 완료
3. 공동 예산과 결제 일정 — 1차 완료
4. 준비 항목과 후보 업체 — 1차 완료
5. 체크리스트와 후기 — 1차 완료
6. 견적과 업체 비교 — 1차 완료
7. 일정·캘린더 — 1차 완료
8. 첨부파일·알림·결제 수정 및 부분 결제

