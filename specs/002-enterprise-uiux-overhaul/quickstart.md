# Quickstart: Orbit Schedule UI/UX Re-Architecture

## 목적

이 문서는 `002-enterprise-uiux-overhaul` 기능의 설계/구현을 시작하기 전에,  
현재 코드베이스를 동일한 기준으로 재현하고 검증하는 실행 가이드다.

## 사전 요구사항

1. Node.js 20+
2. Java 17
3. Docker (통합 의존성 로컬 구동 시)
4. `git` 및 Bash

## 1) 브랜치 확인

```bash
cd /home/lhs/dev/tasks
git checkout 002-enterprise-uiux-overhaul
git status
```

## 2) 프론트엔드 베이스라인 확인

```bash
cd /home/lhs/dev/tasks/frontend/orbit-web
npm install
npm test
npm run build
```

기대 결과:
- Vitest 통과 (`src/lib/auth/profileCompletion.test.ts`)
- 빌드 성공

## 2-1) 계약/통합 테스트 스모크

```bash
cd /home/lhs/dev/tasks/frontend/orbit-web
npx vitest run ../../tests/contract ../../tests/integration
```

기대 결과:
- `tests/contract/*` 및 `tests/integration/*` 통과

## 3) 백엔드 베이스라인 확인 (wrapper 보유 서비스)

```bash
cd /home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway
./gradlew test
```

기대 결과:
- 테스트 및 JaCoCo 리포트 성공

## 3-1) 서비스 전체 테스트 스모크

```bash
cd /home/lhs/dev/tasks
for s in api-gateway identity-access-service workgraph-service agile-ops-service collaboration-service deep-link-service schedule-intelligence-service integration-migration-service; do
  (cd backend/orbit-platform/services/$s && ./gradlew test --no-daemon)
done
```

기대 결과:
- 대상 서비스 테스트 성공

## 3-2) E2E 스모크 (Playwright)

```bash
cd /home/lhs/dev/tasks/tests/e2e
npm install
npx playwright install chromium
npx playwright test -c playwright.config.ts us1-navigation-scope-view.spec.ts --project=chromium
```

기대 결과:
- `us1-navigation-scope-view.spec.ts` 통과

## 4) 헥사고날/테스트 갭 체크 (설계 단계 필수)

아래 스캔으로 서비스별 테스트/아키텍처 테스트 부재를 확인한다.

```bash
cd /home/lhs/dev/tasks
for s in backend/orbit-platform/services/*; do
  [ -d "$s" ] || continue
  n=$(basename "$s")
  main=$(find "$s/src/main/java" -type f -name '*.java' 2>/dev/null | wc -l)
  [ "$main" -eq 0 ] && continue
  test=$(find "$s/src/test/java" -type f -name '*.java' 2>/dev/null | wc -l)
  arch=$(find "$s/src/test/java" -type f \( -name '*HexArchitectureTest.java' -o -name '*ArchitectureTest.java' \) 2>/dev/null | wc -l)
  echo "$n,$main,$test,$arch"
done | sort
```

## 5) 구현 전 우선 보정 체크리스트

1. `gradlew` 없는 서비스(wrapper 부재) 보정 계획 확정
2. ArchUnit 테스트 없는 서비스 추가 계획 확정
3. JaCoCo verification gate 임계치 확정
4. gateway OpenAPI와 route-contract 동기화 정책 확정

## 6) 기능 스모크 시나리오 (구현 후 검증 기준)

1. 로그인 → 워크스페이스 선택 → 프로젝트 보드 진입
2. Work Item 생성 → Board/Timeline/Table 동기 확인
3. Sprint 생성 → DSU 입력 → 블로커 표시 확인
4. Inbox 항목 딥링크 이동 확인
5. AI 평가 실행 성공/폴백 분기 확인

## 7) 참고 문서

- Spec: `/home/lhs/dev/tasks/specs/002-enterprise-uiux-overhaul/spec.md`
- Plan: `/home/lhs/dev/tasks/specs/002-enterprise-uiux-overhaul/plan.md`
- Research: `/home/lhs/dev/tasks/specs/002-enterprise-uiux-overhaul/research.md`
- Data Model: `/home/lhs/dev/tasks/specs/002-enterprise-uiux-overhaul/data-model.md`
- Contract: `/home/lhs/dev/tasks/specs/002-enterprise-uiux-overhaul/contracts/gateway-uiux.openapi.yaml`
