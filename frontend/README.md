# Marry Mate Frontend

Marry Mate 전체 서비스를 위한 Frontend다. 현재 Phase에서는 첫 번째 기능 모듈인 웨딩홀 Venue Tour를 local-first 방식으로 제공한다.

## App 구조

- 공통 App Shell은 브랜드, 최상위 Navigation, 저장 상태처럼 모든 기능이 공유할 UI를 담당한다.
- 기능 화면은 `/venues`, 향후 `/budget`, `/vendors`처럼 최상위 경로별 모듈로 추가한다.
- 현재 존재하지 않는 미래 기능은 Navigation에 미리 노출하지 않는다.

현재 Venue Route:

```text
/venues
/venues/compare
/venues/{venueId}
/venues/{venueId}/visits/new
```

## 주요 기능

- 웨딩홀 후보 등록
- 8개 현장 Section과 접기·펼치기
- 타입이 있는 객관적 Checklist
- Section별 0.5점 만족도와 평가 이유
- 미작성·미확인·해당 없음 구분과 진행률
- 조건 충족도, Section 평균, 전체 만족도 분리
- 예상 비용 계산
- 계약 의향, Deal Breaker, 장단점과 총평
- localStorage 자동 임시 저장
- 방문 기록 조회와 웨딩홀 비교
- JSON 백업
- PWA 설치 및 기본 App Shell 캐시

## 실행

```bash
corepack pnpm install
corepack pnpm dev
```

## 검증

```bash
corepack pnpm lint
corepack pnpm test
```

## Backend 연결

`.env.example`을 참고해 `NEXT_PUBLIC_API_BASE_URL`을 설정한다. 요청/응답에 사용하는 TypeScript 계약은 `app/lib/types.ts`, HTTP Client는 `app/lib/api.ts`에 있다.

Backend가 연결되지 않아도 모든 현장 기록은 브라우저 localStorage에 저장된다. 기존 Wedget v1 데이터는 최초 실행 시 Marry Mate v2 구조로 복사하며 원본 Key는 삭제하지 않는다.
