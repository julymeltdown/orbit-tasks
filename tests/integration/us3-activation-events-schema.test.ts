import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US3 activation event payload schema integration", () => {
  it("keeps activation event union and request payload fields aligned", () => {
    const types = readFileSync(path.resolve(testDir, "../../frontend/orbit-web/src/features/activation/types.ts"), "utf8");
    const contract = readFileSync(path.resolve(testDir, "../../specs/003-activation-uiux-overhaul/contracts/activation-flow.openapi.yaml"), "utf8");

    expect(types).toContain("ActivationEventType");
    expect(types).toContain("EMPTY_STATE_ACTION_CLICKED");
    expect(contract).toContain("eventType");
    expect(contract).toContain("sessionId");
    expect(contract).toContain("elapsedMs");
  });
});
