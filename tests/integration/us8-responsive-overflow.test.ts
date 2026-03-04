import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US8 responsive overflow integration", () => {
  it("layout css includes mobile horizontal scroll handling", () => {
    const css = readFileSync(
      path.resolve(testDir, "../../frontend/orbit-web/src/design/layout.css"),
      "utf8"
    );
    expect(css).toContain("overflow-x: auto");
    expect(css).toContain("@media (max-width: 768px)");
    expect(css).toContain("-webkit-overflow-scrolling: touch");
  });
});

