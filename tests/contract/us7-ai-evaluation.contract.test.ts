import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US7 AI evaluation contract", () => {
  it("schedule controller exposes evaluation and action endpoints", () => {
    const source = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ScheduleEvaluationController.java"
      ),
      "utf8"
    );
    expect(source).toContain("@PostMapping(\"/schedule-evaluations\")");
    expect(source).toContain("@PostMapping(\"/schedule-evaluations/actions\")");
  });

  it("frontend health card renders evidence deep links", () => {
    const source = readFileSync(
      path.resolve(testDir, "../../frontend/orbit-web/src/components/insights/ScheduleHealthCards.tsx"),
      "utf8"
    );
    expect(source).toContain("evidence");
    expect(source).toContain("/app/projects/table?evidence=");
  });
});

