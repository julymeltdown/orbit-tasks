import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US6 collaboration contract", () => {
  it("gateway exposes thread and inbox endpoints", () => {
    const source = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ThreadController.java"
      ),
      "utf8"
    );

    expect(source).toContain("@RequestMapping(\"/api/collaboration\")");
    expect(source).toContain("@PostMapping(\"/threads\")");
    expect(source).toContain("@PostMapping(\"/threads/{threadId}/messages\")");
    expect(source).toContain("@GetMapping(\"/inbox\")");
    expect(source).toContain("@PatchMapping(\"/inbox/{notificationId}/read\")");
  });

  it("collaboration migration includes thread/message/mention tables", () => {
    const migration = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/collaboration-service/src/main/resources/db/migration/V1__collaboration_core.sql"
      ),
      "utf8"
    );

    expect(migration).toContain("collaboration_threads");
    expect(migration).toContain("collaboration_messages");
    expect(migration).toContain("collaboration_mentions");
  });
});
