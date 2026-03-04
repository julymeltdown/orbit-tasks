import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US3 dependency disclosure integration", () => {
  it("board page delegates dependency editing to inspector panel", () => {
    const source = readFileSync(
      path.resolve(testDir, "../../frontend/orbit-web/src/pages/projects/BoardPage.tsx"),
      "utf8"
    );
    expect(source).toContain("DependencyInspectorPanel");
    expect(source).toContain("showDependencyInspector");
  });
});

