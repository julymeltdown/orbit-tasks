import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US3 progressive disclosure integration", () => {
  it("supports core/advanced navigation and collapsible advanced filters", () => {
    const shell = readFileSync(path.resolve(testDir, "../../frontend/orbit-web/src/app/AppShell.tsx"), "utf8");
    const filterBar = readFileSync(path.resolve(testDir, "../../frontend/orbit-web/src/components/projects/ProjectFilterBar.tsx"), "utf8");
    const board = readFileSync(path.resolve(testDir, "../../frontend/orbit-web/src/pages/projects/BoardPage.tsx"), "utf8");

    expect(shell).toContain("visibleAdvancedNav");
    expect(shell).toContain("Hide Advanced");
    expect(filterBar).toContain("More Filters");
    expect(filterBar).toContain("orbit-project-filterbar__advanced");
    expect(board).toContain("Add Details");
  });
});
