import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US3 activation flow contract", () => {
  it("defines activation state and event endpoints in OpenAPI", () => {
    const contract = readFileSync(
      path.resolve(testDir, "../../specs/003-activation-uiux-overhaul/contracts/activation-flow.openapi.yaml"),
      "utf8"
    );

    expect(contract).toContain("/api/v2/activation/state");
    expect(contract).toContain("/api/v2/activation/events");
    expect(contract).toContain("ACTIVATION_PRIMARY_CTA_CLICKED");
    expect(contract).toContain("FIRST_TASK_CREATED");
  });

  it("gateway exposes activation controller routes", () => {
    const controller = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ActivationController.java"
      ),
      "utf8"
    );

    expect(controller).toContain("@RequestMapping(\"/api/v2/activation\")");
    expect(controller).toContain("@GetMapping(\"/state\")");
    expect(controller).toContain("@PostMapping(\"/events\")");
  });
});

