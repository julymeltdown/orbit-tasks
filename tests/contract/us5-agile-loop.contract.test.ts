import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US5 agile loop contract", () => {
  it("gateway exposes sprint, backlog, and dsu endpoints", () => {
    const source = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/SprintController.java"
      ),
      "utf8"
    );

    expect(source).toContain("@RequestMapping(\"/api/agile\")");
    expect(source).toContain("@PostMapping(\"/sprints\")");
    expect(source).toContain("@PostMapping(\"/sprints/{sprintId}/backlog\")");
    expect(source).toContain("@PostMapping(\"/sprints/{sprintId}/dsu\")");
  });

  it("agile ops migration contains sprint/backlog/dsu tables", () => {
    const migration = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/agile-ops-service/src/main/resources/db/migration/V1__agile_ops.sql"
      ),
      "utf8"
    );

    expect(migration).toContain("agile_sprints");
    expect(migration).toContain("agile_backlog_items");
    expect(migration).toContain("agile_dsu_entries");
  });
});
