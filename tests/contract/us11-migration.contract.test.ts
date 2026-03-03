import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US11 migration contract", () => {
  it("gateway exposes import preview/execute/rollback endpoints", () => {
    const source = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/IntegrationController.java"
      ),
      "utf8"
    );

    expect(source).toContain("@RequestMapping(\"/api/integrations\")");
    expect(source).toContain("@PostMapping(\"/imports/preview\")");
    expect(source).toContain("@PostMapping(\"/imports/execute\")");
    expect(source).toContain("@PostMapping(\"/imports/{jobId}/rollback\")");
  });

  it("integration migration schema includes connector and import job tables", () => {
    const migration = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/integration-migration-service/src/main/resources/db/migration/V1__integration_migration.sql"
      ),
      "utf8"
    );

    expect(migration).toContain("integration_connector_subscriptions");
    expect(migration).toContain("import_jobs");
  });
});
