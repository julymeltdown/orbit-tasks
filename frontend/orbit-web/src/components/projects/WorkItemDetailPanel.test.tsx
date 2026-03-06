import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("WorkItemDetailPanel", () => {
  it("uses flat detail sections instead of nested boxed panels", () => {
    const source = readFileSync(path.resolve(testDir, "./WorkItemDetailPanel.tsx"), "utf8");

    expect(source).toContain("orbit-detail-section");
    expect(source).not.toContain("orbit-panel");
    expect(source).toContain("최근 활동");
  });
});
