import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US4 workgraph contract", () => {
  it("gateway exposes work item CRUD and dependency endpoints", () => {
    const source = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/WorkItemController.java"
      ),
      "utf8"
    );

    expect(source).toContain("@PostMapping(\"/api/work-items\")");
    expect(source).toContain("@PatchMapping(\"/api/work-items/{workItemId}\")");
    expect(source).toContain("@PostMapping(\"/api/work-items/{workItemId}/dependencies\")");
  });
});
