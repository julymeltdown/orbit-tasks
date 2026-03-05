import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US3 responsive overflow integration", () => {
  it("keeps mobile shell and filters in single-column flow without forced horizontal overflow", () => {
    const css = readFileSync(path.resolve(testDir, "../../frontend/orbit-web/src/design/layout.css"), "utf8");

    expect(css).toContain("@media (max-width: 480px)");
    expect(css).toContain("flex-direction: column");
    expect(css).toContain(".orbit-project-filterbar__advanced");
  });
});
