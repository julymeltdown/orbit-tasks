import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US1 navigation hierarchy contract", () => {
  it("scope and project-view navigation model is defined", () => {
    const source = readFileSync(
      path.resolve(testDir, "../../frontend/orbit-web/src/app/navigationModel.ts"),
      "utf8"
    );
    expect(source).toContain("scopeNavigation");
    expect(source).toContain("projectViewNavigation");
    expect(source).toContain("canAccessNavItem");
  });

  it("legacy all-pages navigation list is removed from app shell", () => {
    const shell = readFileSync(
      path.resolve(testDir, "../../frontend/orbit-web/src/app/AppShell.tsx"),
      "utf8"
    );
    expect(shell).not.toContain("All Pages");
    expect(shell).toContain("Scope navigation");
    expect(shell).toContain("Project Views");
  });
});

