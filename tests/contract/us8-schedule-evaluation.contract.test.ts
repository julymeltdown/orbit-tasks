import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US8 schedule evaluation contract", () => {
  it("gateway exposes evaluation and action endpoints", () => {
    const source = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ScheduleEvaluationController.java"
      ),
      "utf8"
    );

    expect(source).toContain("@RequestMapping(\"/api/insights\")");
    expect(source).toContain("@PostMapping(\"/schedule-evaluations\")");
    expect(source).toContain("@PostMapping(\"/schedule-evaluations/actions\")");
  });

  it("schedule migration includes evaluation and risk tables", () => {
    const migration = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/schedule-intelligence-service/src/main/resources/db/migration/V1__schedule_evaluation.sql"
      ),
      "utf8"
    );

    expect(migration).toContain("schedule_evaluations");
    expect(migration).toContain("schedule_risks");
  });
});
