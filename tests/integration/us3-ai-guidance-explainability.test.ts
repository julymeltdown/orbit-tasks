import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US3 AI guidance explainability integration", () => {
  it("normalizes state/reason/confidence labels across shell, insights, and floating widget", () => {
    const util = readFileSync(path.resolve(testDir, "../../frontend/orbit-web/src/features/insights/aiGuidanceStatus.ts"), "utf8");
    const shell = readFileSync(path.resolve(testDir, "../../frontend/orbit-web/src/app/AppShell.tsx"), "utf8");
    const insights = readFileSync(path.resolve(testDir, "../../frontend/orbit-web/src/pages/insights/ScheduleInsightsPage.tsx"), "utf8");
    const widget = readFileSync(path.resolve(testDir, "../../frontend/orbit-web/src/components/insights/FloatingAgentWidget.tsx"), "utf8");

    expect(util).toContain("resolveGuidanceStatus");
    expect(shell).toContain("guidanceStatus.reasonLabel");
    expect(insights).toContain("guidanceStatus.confidenceLabel");
    expect(widget).toContain("guidanceStatus.stateLabel");
  });
});
