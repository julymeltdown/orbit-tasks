<!--
Sync Impact Report
- Version change: 0.1.0 -> 0.2.0
- Modified principles:
  - Added IV. Hexagonal Architecture Enforcement
- Added sections: None
- Removed sections: None
- Templates requiring updates:
  - .specify/templates/plan-template.md (updated)
  - .specify/templates/spec-template.md (updated)
  - .specify/templates/tasks-template.md (updated)
- Follow-up TODOs: None
-->

# Boilerplate Spring MSA Constitution

## Core Principles

### I. Service Autonomy & Independent Lifecycle
- Each service is a standalone Spring Boot application with its own build file,
  dependencies, and runtime configuration.
- Every service MUST build and run independently using a service-local command.
- Services MUST start without requiring other services to be running; use stubs,
  mocks, or local fallbacks for development where needed.
- Cross-service integration occurs only via networked contracts
  (HTTP/gRPC/messaging), not shared runtime modules.

Rationale: Independent build/run keeps services deployable and testable in
isolation.

### II. Official Documentation-First (Spring Security 7 & Spring gRPC)
- Implementations of Spring Security 7 and Spring gRPC MUST follow the official
  Spring documentation as the source of truth.
- Specs/plans MUST record the exact documentation version and URL used when
  these technologies are in scope.
- Any deviation requires explicit rationale and approval in the plan.

Rationale: Using official guidance reduces security risk and upgrade drift.

### III. Contracted Interfaces & Versioning
- Every inter-service API/event/proto MUST be defined as an explicit, versioned
  contract stored with the owning service.
- Breaking changes require a version bump and a migration plan before
  implementation.

Rationale: Versioned contracts preserve service independence and safe evolution.

### IV. Hexagonal Architecture Enforcement
- Each service MUST implement Hexagonal Architecture (ports and adapters).
- Domain and application layers MUST be free of framework dependencies.
- Inbound adapters (HTTP/gRPC) MUST only depend on application ports.
- Outbound adapters (DB/Redis/SMTP/HTTP clients) MUST implement output ports
  defined in the application layer.
- Every service MUST include automated architecture tests (e.g., ArchUnit) that
  fail the build on layer violations.

Rationale: Enforced boundaries keep services maintainable and independent.

## Architecture & Tooling Constraints

- All services in this repository are Spring Boot-based microservices and live
  in separate service directories with their own build configuration.
- Shared libraries are allowed only for cross-cutting utilities and MUST NOT
  require a multi-service build or a coupled runtime.
- Each service MUST publish minimal local run instructions and required
  environment variables.
- Each service MUST use an explicit hexagonal package layout: `domain`,
  `application` (ports/use cases), `adapters/in`, `adapters/out`, and `config`.

## Development Workflow & Quality Gates

- Every feature plan MUST include a constitution check with per-service
  build/run commands and any required local stubs.
- Specs MUST declare new or changed service contracts and their versions.
- Reviews MUST verify compliance; exceptions require explicit documentation and
  a follow-up issue.
- Reviews MUST verify hexagonal layer boundaries and the presence of
  architecture tests per service.

## Governance

- This constitution supersedes conflicting guidance in specs, plans, or tasks.
- Amendments require a pull request that updates this file and any dependent
  templates or guidance.
- Versioning follows semantic versioning: MAJOR for removals/redefinitions,
  MINOR for new principles/sections, PATCH for clarifications.
- Compliance is reviewed in each plan/spec; violations must be documented in
  the plan and approved by maintainers.

**Version**: 0.2.0 | **Ratified**: 2026-01-11 | **Last Amended**: 2026-01-11
