import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US3 board drag atomicity", () => {
  it("board card applies drag transform on a single container", () => {
    const source = readFileSync(
      path.resolve(testDir, "../../frontend/orbit-web/src/pages/projects/BoardPage.tsx"),
      "utf8"
    );
    expect(source).toContain("transform: CSS.Translate.toString(transform)");
    expect(source).toContain("orbit-notion-card");
  });
});

