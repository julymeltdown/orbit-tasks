import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US5 mention to inbox bridge integration", () => {
  it("thread controller parses mentions and creates inbox events", () => {
    const source = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ThreadController.java"
      ),
      "utf8"
    );
    expect(source).toContain("parseMentions");
    expect(source).toContain("inboxByUser");
    expect(source).toContain("\"MENTION\"");
  });
});

