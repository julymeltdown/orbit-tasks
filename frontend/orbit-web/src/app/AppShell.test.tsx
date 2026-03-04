import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("AppShell", () => {
  it("includes skip-link and mobile menu disclosure", () => {
    const source = readFileSync(path.resolve(testDir, "./AppShell.tsx"), "utf8");
    expect(source).toContain("Skip to content");
    expect(source).toContain("orbit-mobile-menu-button");
    expect(source).toContain("aria-controls=\"orbit-side-nav\"");
  });

  it("uses scope navigation model with role gating", () => {
    const source = readFileSync(path.resolve(testDir, "./AppShell.tsx"), "utf8");
    expect(source).toContain("scopeNavigation.filter");
    expect(source).toContain("canAccessNavItem");
    expect(source).toContain("Project Views");
  });
});
