# boilerplate-spring-msa Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-11

## Active Technologies
- TypeScript 5.x (frontend), Java 17 (API gateway) + React + Zustand + shadcn/ui + Tailwind, React Router, (002-frontend-gateway)
- Browser storage for access tokens (memory + session), HTTP-only (002-frontend-gateway)
- Java 17 + Spring Boot 4.0.x, Spring Security 7.x, Spring gRPC 1.0.x, Spring Web (current gateway), Spring Boot Actuator, Protobuf tooling (001-api-gateway-improvements)
- No new persistence in the gateway; route contracts/policy metadata live in configuration sources and telemetry is stored in external observability systems (001-api-gateway-improvements)

- Java 17 (toolchain pinned per service) + Spring Boot 4.0.x, Spring Security 7.x, Spring gRPC 1.0.1, Spring Data JPA, Spring Data Redis, Spring Boot Actuator, OAuth2 Client/Resource Server, Protobuf/gRPC (001-jwt-auth-msa)

## Project Structure

```text
src/
tests/
```

## Commands

# Add commands for Java 17 (toolchain pinned per service)

## Code Style

Java 17 (toolchain pinned per service): Follow standard conventions

## Recent Changes
- 001-api-gateway-improvements: Added Java 17 + Spring Boot 4.0.x, Spring Security 7.x, Spring gRPC 1.0.x, Spring Web (current gateway), Spring Boot Actuator, Protobuf tooling
- 002-frontend-gateway: Added TypeScript 5.x (frontend), Java 17 (API gateway) + React + Zustand + shadcn/ui + Tailwind, React Router,
- 001-jwt-auth-msa: Added Java 17 (toolchain pinned per service) + Spring Boot 4.0.x, Spring Security 7.x, Spring gRPC 1.0.1, Spring Data JPA, Spring Data Redis, Spring Boot Actuator, OAuth2 Client/Resource Server, Protobuf/gRPC

<!-- MANUAL ADDITIONS START -->
## Repository Rules

- Each service must be buildable as an executable jar from its own directory via `./gradlew bootJar`.
- Do not add shared source code or modules; avoid root multi-project builds, `buildSrc`, or any `shared/` directory.
- Enforce hexagonal architecture in every service: keep `domain/`, `application/`, `adapters/in`, `adapters/out`, `config` and add `HexArchitectureTest` (ArchUnit) that fails the build on any layer violation.
<!-- MANUAL ADDITIONS END -->
