# Topic Conventions

## Objective

Standardize Kafka topic names for Orbit bounded contexts.

## Format

`orbit.<env>.<context>.<stream>.<version>`

- `env`: `dev|stg|prod`
- `context`: bounded context owner (`identity`, `team`, `workgraph`, `agile`, `collab`, `notification`, `deeplink`, `schedule`, `migration`)
- `stream`: semantic stream (`domain-events`, `audit-events`, `dlq`, `metrics`)
- `version`: topic schema generation (`v1`, `v2`, ...)

### Examples

- `orbit.dev.workgraph.domain-events.v1`
- `orbit.prod.collab.domain-events.v1`
- `orbit.prod.notification.audit-events.v1`
- `orbit.prod.schedule.dlq.v1`

## Partitioning Guidance

- Use `workspaceId` as default partition key.
- For high-volume streams, compose key as `workspaceId:aggregateId`.
- Keep ordering requirements local to aggregate, not globally serialized.

## Retention Guidance

- `domain-events`: 7 days (minimum), compact optional when key-stable.
- `audit-events`: 365+ days depending on tenant policy.
- `dlq`: 14 days minimum with alerting and replay tooling.

## Required Headers

- `x-event-id`
- `x-event-type`
- `x-correlation-id`
- `x-workspace-id`
- `x-producer`
