import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("InboxPage", () => {
  it("renders triage-oriented inbox rows with urgency and next action", () => {
    const source = readFileSync(path.resolve(testDir, "./InboxPage.tsx"), "utf8");

    expect(source).toContain("협업 triage");
    expect(source).toContain("resolveInboxUrgencyLabel");
    expect(source).toContain("다음 행동:");
    expect(source).toContain("ThreadPanel");
  });
});
