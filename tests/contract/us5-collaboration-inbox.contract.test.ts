import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US5 collaboration inbox contract", () => {
  it("inbox page uses triage filter bar and thread panel", () => {
    const source = readFileSync(
      path.resolve(testDir, "../../frontend/orbit-web/src/pages/inbox/InboxPage.tsx"),
      "utf8"
    );
    expect(source).toContain("InboxFilterBar");
    expect(source).toContain("ThreadPanel");
    expect(source).toContain("Resolve");
  });

  it("thread controller exposes inbox resolve endpoint", () => {
    const source = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ThreadController.java"
      ),
      "utf8"
    );
    expect(source).toContain("@PatchMapping(\"/inbox/{notificationId}/resolve\")");
  });
});

