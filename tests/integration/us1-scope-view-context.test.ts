import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US1 scope-view context integration", () => {
  it("app shell keeps scope navigation separate from project views", () => {
    const shell = readFileSync(
      path.resolve(testDir, "../../frontend/orbit-web/src/app/AppShell.tsx"),
      "utf8"
    );
    expect(shell).toContain("scopeNavigation");
    expect(shell).toContain("projectViewNavigation");
    expect(shell).toContain("Scope navigation");
    expect(shell).toContain("Project Views");
  });
});

