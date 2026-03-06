import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("TimelinePage", () => {
  it("frames the timeline as planning with scheduled and unscheduled work", () => {
    const source = readFileSync(path.resolve(testDir, "./TimelinePage.tsx"), "utf8");

    expect(source).toContain("날짜와 상태를 함께 보는 계획 화면");
    expect(source).toContain("scheduledItems");
    expect(source).toContain("미배치 작업");
    expect(source).toContain("orbit-timeline-row__track-span");
  });
});
