import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US9 admin RBAC", () => {
  it("router wraps compliance route with RequireAdmin", () => {
    const source = readFileSync(path.resolve(testDir, "../../frontend/orbit-web/src/app/router.tsx"), "utf8");
    expect(source).toContain("function RequireAdmin");
    expect(source).toContain("role !== \"WORKSPACE_ADMIN\"");
    expect(source).toContain("path: \"admin/compliance\"");
    expect(source).toContain("<RequireAdmin>");
  });

  it("navigation model role-gates admin navigation", () => {
    const source = readFileSync(path.resolve(testDir, "../../frontend/orbit-web/src/app/navigationModel.ts"), "utf8");
    expect(source).toContain("minRole: \"WORKSPACE_ADMIN\"");
    expect(source).toContain("canAccessNavItem");
  });
});
