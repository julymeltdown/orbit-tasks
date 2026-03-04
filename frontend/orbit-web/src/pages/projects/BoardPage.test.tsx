import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("BoardPage", () => {
  it("contains keyboard fallback affordance for status updates", () => {
    const source = readFileSync(path.resolve(testDir, "./BoardPage.tsx"), "utf8");
    expect(source).toContain("Move with keyboard");
    expect(source).toContain("ArrowLeft");
    expect(source).toContain("ArrowRight");
  });

  it("renders dependency inspector panel in board layout", () => {
    const source = readFileSync(path.resolve(testDir, "./BoardPage.tsx"), "utf8");
    expect(source).toContain("DependencyInspectorPanel");
    expect(source).toContain("showDependencyInspector");
  });
});
