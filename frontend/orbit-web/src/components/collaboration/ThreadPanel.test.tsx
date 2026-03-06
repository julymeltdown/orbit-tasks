import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("ThreadPanel", () => {
  it("loads server thread context instead of placeholder copy", () => {
    const source = readFileSync(path.resolve(testDir, "./ThreadPanel.tsx"), "utf8");

    expect(source).toContain("/api/v2/threads/${focusThreadId}");
    expect(source).toContain("원본 작업");
    expect(source).toContain("권장 처리");
    expect(source).toContain("메시지 전송");
  });
});
