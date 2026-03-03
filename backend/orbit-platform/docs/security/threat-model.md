# Orbit Schedule Threat Model

## Scope

- Surface: `api-gateway`, `identity-access-service`, `schedule-intelligence-service`, `collaboration-service`, `deep-link-service`
- Data classes: profile data, DSU text, thread/mention content, schedule evaluation payloads, governance audit logs
- Trust boundaries:
  - Browser -> API Gateway
  - API Gateway -> Internal gRPC services
  - Internal services -> External AI provider
  - Internal services -> storage (PostgreSQL/Redis)

## Assets

1. Access tokens and workspace claims
2. Governance controls (retention, AI policy, audit events)
3. Schedule evaluation outputs and recommendations
4. Collaboration artifacts (thread messages, mentions, inbox notifications)
5. Migration jobs and rollback snapshots

## Threats and Mitigations

### Identity and session abuse

- Threat: token theft, session replay
- Mitigation:
  - HttpOnly refresh cookie handling in gateway
  - JWT resource server verification
  - short access-token lifetime and refresh rotation

### Privilege escalation

- Threat: non-admin actors invoking governance endpoints
- Mitigation:
  - gateway policy check + endpoint-level role gates
  - immutable audit events for every governance mutation

### Data exfiltration via AI calls

- Threat: PII leakage in DSU/doc payloads
- Mitigation:
  - policy evaluator blocks unsafe calls (store:false, token budget, masking)
  - redaction hook before AI dispatch
  - audit trails for AI-control changes

### Deep-link abuse

- Threat: guessing/reusing deep-link tokens, phishing-style redirects
- Mitigation:
  - token TTL and consumed-state enforcement
  - fixed-path resolution only (no arbitrary external URL redirect)
  - anomaly alerts for auth-bounce spikes

### Migration misuse

- Threat: destructive import, non-recoverable overwrite
- Mitigation:
  - preview validation required
  - rollback snapshot persisted before execute
  - explicit rollback endpoint and auditability

### Availability degradation

- Threat: traffic spikes, retry storms, dependency timeout
- Mitigation:
  - stricter gateway rate limits and retry defaults
  - circuit-breaker enabled by default
  - SLO alert rules for 5xx and fallback anomalies

## Residual Risks

1. Playwright visual baseline execution is environment-dependent
2. AI decision quality depends on upstream data quality and policy correctness
3. Migration mapping quality still requires human review before execute

## Review Cadence

- Security review every release candidate
- Threat model update on new public endpoint or new external integration
