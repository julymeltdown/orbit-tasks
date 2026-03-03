import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US2 Profile contract", () => {
  it("gateway profile controller exposes settings endpoints", () => {
    const controllerPath = path.resolve(
      testDir,
      "../../backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ProfileController.java"
    );
    const source = readFileSync(controllerPath, "utf8");

    expect(source).toContain("@GetMapping(\"/settings\")");
    expect(source).toContain("@PatchMapping(\"/settings\")");
  });

  it("profile migration includes presence/preferences columns", () => {
    const migrationPath = path.resolve(
      testDir,
      "../../backend/orbit-platform/services/profile-service/src/main/resources/db/migration/V1__profile_presence_preferences.sql"
    );
    const migration = readFileSync(migrationPath, "utf8");

    expect(migration).toContain("presence_status");
    expect(migration).toContain("timezone");
    expect(migration).toContain("notification_pref");
  });
});
