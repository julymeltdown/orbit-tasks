import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("navigationModel progressive disclosure", () => {
  it("defines tiered scope navigation and split helper", () => {
    const source = readFileSync(path.resolve(testDir, "./navigationModel.ts"), "utf8");

    expect(source).toContain('tier?: "core" | "advanced"');
    expect(source).toContain("splitScopeNavigationByTier");
    expect(source).toContain('tier: "advanced"');
  });
});
