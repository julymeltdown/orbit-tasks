import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("ScheduleInsightsPage", () => {
  it("uses normalized guidance status for explainability", () => {
    const source = readFileSync(path.resolve(testDir, "./ScheduleInsightsPage.tsx"), "utf8");

    expect(source).toContain("resolveGuidanceStatus");
    expect(source).toContain("guidanceStatus.reasonLabel");
    expect(source).toContain("guidanceStatus.confidenceLabel");
  });

  it("tracks evaluation lifecycle activation events", () => {
    const source = readFileSync(path.resolve(testDir, "./ScheduleInsightsPage.tsx"), "utf8");

    expect(source).toContain("INSIGHT_EVALUATION_STARTED");
    expect(source).toContain("INSIGHT_EVALUATION_COMPLETED");
  });
});
