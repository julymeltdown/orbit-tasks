import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US10 governance contract", () => {
  it("gateway exposes governance admin endpoints", () => {
    const source = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/admin/GovernanceAdminController.java"
      ),
      "utf8"
    );

    expect(source).toContain("@RequestMapping(\"/api/admin/governance\")");
    expect(source).toContain("@PostMapping(\"/retention-rules\")");
    expect(source).toContain("@PostMapping(\"/ai-controls\")");
    expect(source).toContain("@GetMapping(\"/audit-events\")");
  });

  it("identity access migration includes immutable audit events", () => {
    const migration = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/identity-access-service/src/main/resources/db/migration/V2__audit_events.sql"
      ),
      "utf8"
    );

    expect(migration).toContain("identity_audit_events");
    expect(migration).toContain("payload JSONB");
  });
});
