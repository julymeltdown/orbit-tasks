# Quickstart - Orbit Schedule Implementation Validation

## Prerequisites

- Node.js 20+
- Java 17+
- Docker (optional for local infra)
- Existing repo checked out at `/home/lhs/dev/tasks`

## 1) Frontend setup

```bash
cd /home/lhs/dev/tasks/frontend/orbit-web
npm install
npm run build
```

## 2) Contract/Integration validation (feature-level)

```bash
cd /home/lhs/dev/tasks/frontend/orbit-web
npx vitest --root /home/lhs/dev/tasks run \
  tests/contract/us1-auth-gateway.contract.test.ts \
  tests/contract/us2-profile.contract.test.ts \
  tests/contract/us3-team-lifecycle.contract.test.ts \
  tests/contract/us4-workgraph.contract.test.ts \
  tests/contract/us5-agile-loop.contract.test.ts \
  tests/contract/us6-collaboration.contract.test.ts \
  tests/contract/us7-deeplink.contract.test.ts \
  tests/contract/us8-schedule-evaluation.contract.test.ts \
  tests/contract/us9-portfolio.contract.test.ts \
  tests/contract/us10-governance.contract.test.ts \
  tests/contract/us11-migration.contract.test.ts

npx vitest --root /home/lhs/dev/tasks run \
  tests/integration/us2-profile-propagation.test.ts \
  tests/integration/us3-team-rbac.test.ts \
  tests/integration/us4-dependency-cycle.test.ts \
  tests/integration/us5-dsu-pipeline.test.ts \
  tests/integration/us6-mention-inbox-latency.test.ts \
  tests/integration/us8-ai-fallback-confidence.test.ts \
  tests/integration/us9-escalation-ranking.test.ts \
  tests/integration/us10-ai-policy-enforcement.test.ts \
  tests/integration/us11-migration-preview-rollback.test.ts
```

## 3) API Gateway regression

```bash
cd /home/lhs/dev/tasks/backend/orbit-platform/services/api-gateway
./gradlew test --no-daemon
```

## 4) Manual smoke route checklist

1. `/login` -> sign in -> `/workspace/select`
2. `/projects/board`, `/projects/timeline`, `/projects/table`
3. `/sprint` DSU submit
4. `/inbox` thread mention and mark-read
5. `/dl/{token}` deep-link resolution and auth bounce
6. `/insights` schedule evaluation and action capture
7. `/portfolio` overview and CSV export
8. `/admin/compliance` retention/AI-control changes and evidence export
9. `/integrations/import` preview/execute/rollback

## Notes

- Playwright E2E/visual specs are included but not executed in this validation pass unless Playwright runtime is provisioned.
- Governance and integration endpoints currently use in-memory adapters for implementation-phase verification.
