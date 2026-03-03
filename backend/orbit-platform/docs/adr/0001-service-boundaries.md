# ADR-0001: Orbit Service Boundaries from Event Storming

- Status: Accepted
- Date: 2026-03-03
- Deciders: Orbit Platform Team
- Context source: `/home/lhs/dev/tasks/specs/001-orbit-schedule-health/plan.md`

## Context

Orbit Schedule combines enterprise scheduling, agile operations, and Slack-inspired collaboration.
The existing boilerplate provides reusable patterns (gateway policy routing, auth flow, gRPC, outbox),
but its domain model is SNS-oriented.

We need service boundaries that preserve autonomy, simplify governance, and align with collaboration scope:
thread/mention/notification/profile plus login/team/deeplink.

## Decision

Adopt bounded-context microservices with an explicit event contract:

1. `identity-access-service`
2. `profile-service`
3. `team-service`
4. `workgraph-service`
5. `agile-ops-service`
6. `collaboration-service`
7. `notification-service`
8. `deep-link-service`
9. `schedule-intelligence-service`
10. `integration-migration-service`
11. `api-gateway` as ingress and composition point
12. `platform-event-kit` as shared event/audit/trace infrastructure

## Domain Ownership

- Identity/access owns user session, workspace claim, and governance admin policy registry.
- Profile owns user profile, presence, timezone, locale, and notification preferences.
- Team owns membership, invitations, and role bindings.
- Workgraph owns work item lifecycle, dependency graph, cycle guard, and schedule anchors.
- Agile ops owns sprint/backlog/DSU/review/retrospective artifacts.
- Collaboration owns threads, messages, mention extraction, and work-context discussion.
- Notification owns inbox delivery, read-state, fan-out orchestration, and channel preferences.
- Deep link owns share token lifecycle and secure redirect restoration.
- Schedule intelligence owns deterministic risk engine, LLM orchestration, and advice records.
- Integration/migration owns connector auth metadata, migration previews, execution, and rollback snapshots.

## Eventing and Consistency

- Transactional outbox per service; async integration via Kafka topics.
- Standard envelope schema: `contracts/events/event-envelope.schema.json`.
- Topic naming by bounded context and event class.
- Consumers must be idempotent on `eventId`.

## Security and Governance

- Gateway enforces authentication and coarse route guardrails.
- Service-level authorization uses workspace/team claims and local policy checks.
- All sensitive mutations emit immutable audit events.
- AI data egress is controlled by service-level policy evaluation.

## Consequences

### Positive

- High change isolation across contexts.
- Better team ownership and release independence.
- Clear compliance traceability for enterprise operations.

### Negative

- More service interfaces and operational overhead.
- Additional integration tests needed for end-to-end confidence.

### Mitigations

- Shared contracts and generated stubs.
- Common event/security libraries in `platform-event-kit`.
- Gateway contract governance and automated checks.
