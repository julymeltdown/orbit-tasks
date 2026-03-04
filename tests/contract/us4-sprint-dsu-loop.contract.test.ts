import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US4 sprint DSU loop contract", () => {
  it("sprint page contains no-active-sprint empty state and DSU composer", () => {
    const source = readFileSync(
      path.resolve(testDir, "../../frontend/orbit-web/src/pages/sprint/SprintWorkspacePage.tsx"),
      "utf8"
    );
    expect(source).toContain("No active sprint selected");
    expect(source).toContain("DSUComposerPanel");
  });

  it("agile migration V2 exists for runtime sprint/dsu fields", () => {
    const migration = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/agile-ops-service/src/main/resources/db/migration/V2__sprint_dsu_runtime.sql"
      ),
      "utf8"
    );
    expect(migration).toContain("agile_dsu_entries");
    expect(migration).toContain("structured_signals_json");
  });
});

