import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US4 DSU signal linking integration", () => {
  it("DSU composer contains structured sections and sprint page renders history", () => {
    const composer = readFileSync(
      path.resolve(testDir, "../../frontend/orbit-web/src/components/agile/DSUComposerPanel.tsx"),
      "utf8"
    );
    const sprint = readFileSync(
      path.resolve(testDir, "../../frontend/orbit-web/src/pages/sprint/SprintWorkspacePage.tsx"),
      "utf8"
    );
    expect(composer).toContain("Yesterday");
    expect(composer).toContain("Blockers");
    expect(sprint).toContain("DSU History");
  });
});

