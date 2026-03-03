import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US7 deep-link contract", () => {
  it("gateway exposes token resolve and /dl bounce endpoints", () => {
    const source = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/DeepLinkController.java"
      ),
      "utf8"
    );

    expect(source).toContain("@PostMapping(\"/api/deeplinks\")");
    expect(source).toContain("@GetMapping(\"/api/deeplinks/{token}/resolve\")");
    expect(source).toContain("@GetMapping(\"/dl/{token}\")");
  });

  it("deep-link migration includes token storage schema", () => {
    const migration = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/deep-link-service/src/main/resources/db/migration/V1__deep_link_tokens.sql"
      ),
      "utf8"
    );

    expect(migration).toContain("deep_link_tokens");
    expect(migration).toContain("expires_at");
    expect(migration).toContain("target_path");
  });
});
