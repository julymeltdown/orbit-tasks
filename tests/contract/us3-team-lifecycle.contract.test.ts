import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US3 team lifecycle contract", () => {
  it("gateway exposes create/invite/role endpoints", () => {
    const controller = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/TeamController.java"
      ),
      "utf8"
    );

    expect(controller).toContain("@PostMapping(\"/api/teams\")");
    expect(controller).toContain("@PostMapping(\"/api/teams/{teamId}/members\")");
    expect(controller).toContain("@PatchMapping(\"/api/teams/{teamId}/members/{userId}/role\")");
  });
});
