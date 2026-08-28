# Marry Mate Mac mini Self-hosting

Marry Mate의 Frontend는 현재 공개 배포를 유지하고, Spring Boot API와 MySQL은 Mac mini에서 Docker로 운영합니다. 외부 요청은 Cloudflare Tunnel을 통해 API에만 전달하며 MySQL은 인터넷에 공개하지 않습니다.

```text
Public Frontend
      |
      | HTTPS
      v
Cloudflare Tunnel
      |
      v
Spring Boot API ---- MySQL
       Mac mini Docker network
```

## 보안 경계

- 공유기에서 `8080` 또는 `3306` 포트포워딩을 만들지 않습니다.
- MySQL과 API의 host port는 `127.0.0.1`에만 바인딩합니다.
- Cloudflare Tunnel 컨테이너만 Docker network 안에서 `api:8080`에 접근합니다.
- 비밀번호와 Tunnel token은 `backend/.env`에만 저장하고 Git에 커밋하지 않습니다.
- CORS는 브라우저 출처 제한일 뿐 인증 수단이 아닙니다. 공개 전 가입 제한과 요청 제한을 별도로 구현합니다.

## 1. 환경 변수 준비

```bash
cd backend
cp .env.example .env
```

`backend/.env`의 두 DB 비밀번호를 서로 다른 긴 무작위 문자열로 교체합니다. Tunnel token은 아직 없어도 로컬 API와 DB를 먼저 실행할 수 있습니다.

## 2. API와 MySQL 실행

```bash
cd backend
docker compose up -d --build mysql api
docker compose ps
curl http://127.0.0.1:8080/actuator/health
```

정상 응답:

```json
{"status":"UP"}
```

Compose의 `restart: unless-stopped` 설정으로 Docker Desktop이 시작되면 컨테이너도 다시 실행됩니다. Mac mini 로그인 후 Docker Desktop이 자동 실행되도록 설정하고, 시스템 잠자기를 비활성화해야 합니다.

로그 확인:

```bash
docker compose logs --tail=200 api mysql
```

종료:

```bash
docker compose down
```

`docker compose down`은 DB volume을 삭제하지 않습니다. `down -v`는 실제 데이터를 제거하므로 운영 환경에서는 사용하지 않습니다.

## 3. Cloudflare Tunnel 생성

Cloudflare Zero Trust Dashboard에서 Tunnel을 생성하고 Docker용 token을 발급합니다.

Public hostname 예시:

```text
Hostname: api.marrymate.example
Service type: HTTP
Service URL: api:8080
```

발급받은 값은 `backend/.env`의 `CLOUDFLARE_TUNNEL_TOKEN`에 넣습니다. Dashboard의 Service URL은 `localhost:8080`이 아니라 Compose service 이름인 `api:8080`이어야 합니다.

Tunnel까지 실행:

```bash
cd backend
docker compose --profile tunnel up -d
docker compose ps
```

외부 확인:

```bash
curl https://api.marrymate.example/actuator/health
```

## 4. Frontend 연결 전환

Tunnel 주소가 안정적으로 동작한 후 Frontend 배포 환경의 `NEXT_PUBLIC_API_BASE_URL`을 새 API origin으로 변경합니다.

```text
NEXT_PUBLIC_API_BASE_URL=https://api.marrymate.example
```

Backend의 `MARRY_MATE_CORS_ORIGINS`에는 실제 Frontend origin을 유지합니다. 주소 끝의 `/`는 넣지 않습니다.

전환 뒤 두 휴대폰에서 아래 흐름을 확인합니다.

1. 사용자 A 가입과 로그인
2. Workspace 초대 코드 생성
3. 사용자 B 가입과 로그인
4. 사용자 B가 초대 코드로 Workspace 참여
5. 사용자 A가 Venue Visit 저장
6. 사용자 B가 같은 기록 조회
7. Mac mini API 재시작 후에도 기록 유지

## 5. Railway 데이터 이전

운영 데이터가 있다면 Frontend 전환 전에 쓰기를 잠시 중단하고 Railway MySQL을 dump합니다.

```bash
mysqldump --single-transaction --routines --triggers \
  -h RAILWAY_MYSQL_HOST -P RAILWAY_MYSQL_PORT \
  -u RAILWAY_MYSQL_USER -p RAILWAY_MYSQL_DATABASE \
  > marry_mate_before_cutover.sql
```

로컬 MySQL에 import합니다.

```bash
docker compose exec -T mysql mysql \
  -u marry_mate -p marry_mate \
  < marry_mate_before_cutover.sql
```

명령 실행 시 비밀번호를 입력합니다. 이전 직전 Railway backup을 별도 보관하고, Mac mini 운영이 확인될 때까지 Railway 서비스를 바로 삭제하지 않습니다.

## 6. 운영 체크리스트

- Mac mini 자동 로그인 또는 재부팅 후 Docker 자동 시작 확인
- 시스템 잠자기 비활성화
- `mysql`, `api`, `tunnel` 컨테이너 health와 restart 상태 확인
- 외부 health endpoint 모니터링
- MySQL 일일 dump 생성
- dump를 Mac mini가 아닌 암호화된 외부 저장소에도 보관
- macOS, Docker, base image 정기 업데이트
- 가입 제한과 로그인 rate limit 적용
- 이미지 업로드는 MySQL이나 Mac mini disk가 아닌 Object Storage 사용
- 장애 시 사용할 Railway rollback 기간 확보

## 권장 전환 순서

```text
Mac mini API/DB 로컬 검증
→ 가입 제한 구현
→ Cloudflare Tunnel 연결
→ Railway DB dump/import
→ Frontend API 주소 변경
→ 두 기기 통합 테스트
→ 48시간 관찰
→ Railway 종료 여부 결정
```
