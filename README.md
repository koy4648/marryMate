# Wedget Frontend

웨딩홀 암행투어 현장에서 사용하는 local-first Frontend다.

## 주요 기능

- 웨딩홀 후보 등록
- 모바일 별점 평가와 평가 이유 기록
- 미작성/미확인 구분과 진행률
- 현장 Checklist
- 예상 비용 계산
- 좋았던 점, 아쉬운 점, 총평
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

Backend가 연결되지 않아도 모든 현장 기록은 브라우저 localStorage에 저장된다.
