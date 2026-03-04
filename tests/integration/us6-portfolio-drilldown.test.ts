import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US6 portfolio drilldown", () => {
  it("risk distribution widget exposes table drilldown links", () => {
    const source = readFileSync(
      path.resolve(testDir, "../../frontend/orbit-web/src/components/portfolio/RiskDistributionWidget.tsx"),
      "utf8"
    );
    expect(source).toContain("/app/projects/table?status=DONE");
    expect(source).toContain("/app/projects/table?status=REVIEW");
    expect(source).toContain("/app/projects/table?status=TODO");
  });

  it("escalation table exposes timeline deep-link actions", () => {
    const source = readFileSync(
      path.resolve(testDir, "../../frontend/orbit-web/src/components/portfolio/EscalationCandidateTable.tsx"),
      "utf8"
    );
    expect(source).toContain("/app/projects/timeline?project=");
    expect(source).toContain("Open");
  });
});
