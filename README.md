# Marry Mate V2

> 둘이 함께 비교하고 결정하는 결혼 준비 공간

Marry Mate V2는 준비 항목, 후보 업체, 체크리스트, 견적, 계약, 결제 일정과 실제 사용 금액을 Couple Workspace에서 함께 관리하는 서비스입니다.

## 현재 구현 단계

- 새 V2 프로젝트 기반
- Spring Boot 4, Java 21, MySQL, Flyway
- React 19, TypeScript, Vite
- 계약금·중도금·잔금 예산 도메인 초안
- 모바일 우선 대시보드 골격

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

## 검증

```bash
cd backend && ./gradlew test
cd frontend && corepack pnpm lint && corepack pnpm test && corepack pnpm build
```

## 개발 순서

1. 프로젝트와 DB 기반
2. 사용자 인증과 Couple Workspace
3. 준비 항목과 후보 업체
4. 체크리스트와 후기
5. 견적과 업체 비교
6. 예산·계약·결제
7. 일정·할 일·첨부파일

