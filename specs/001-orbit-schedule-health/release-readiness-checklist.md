# Release Readiness Checklist - Orbit Schedule

## Scope

- Feature set: US1 ~ US11
- Verification date: 2026-03-03
- Branch baseline: `main`

## Functional Validation

- [x] Login and workspace entry flow (US1)
- [x] Profile/presence settings flow (US2)
- [x] Team lifecycle and role mutation flow (US3)
- [x] Workgraph multi-view baseline (US4)
- [x] Sprint/backlog/DSU loop (US5)
- [x] Thread/mention/inbox collaboration (US6)
- [x] Deep-link auth bounce and intent restore (US7)
- [x] Schedule evaluation + fallback + action workflow (US8)
- [x] Portfolio overview and escalation ranking (US9)
- [x] Governance controls and evidence export (US10)
- [x] Integration migration preview/execute/rollback (US11)

## Automated Validation Evidence

- [x] `api-gateway` test suite passes
- [x] frontend production build passes
- [x] contract tests pass for US1~US11
- [x] integration tests pass for US2~US11
- [x] perf benchmark test file added (Phase14)
- [x] visual baseline spec added (Phase14)

## Security and Operations

- [x] Threat model documented
- [x] Incident response runbook documented
- [x] Deep-link abuse response runbook documented
- [x] Migration operations runbook documented
- [x] SLO alert rules added
- [x] Gateway resilience/rate-limit defaults hardened

## Governance

- [x] Audit event schema/mutation logging support added
- [x] Retention policy scheduling added
- [x] AI control policy evaluator added

## Sign-off Notes

- Playwright runtime execution for E2E/visual specs deferred to CI environment with browser binaries.
- Several service implementations are lightweight in-memory orchestration suitable for spec-implementation phase; production hardening requires persistence and authz enforcement per service.
