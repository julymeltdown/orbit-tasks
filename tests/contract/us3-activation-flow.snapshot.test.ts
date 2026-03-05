import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US3 activation flow snapshot contract", () => {
  it("activation contract includes stage and navigation profile fields", () => {
    const contract = readFileSync(
      path.resolve(testDir, "../../specs/003-activation-uiux-overhaul/contracts/activation-flow.openapi.yaml"),
      "utf8"
    );

    expect(contract).toMatchSnapshot();
    expect(contract).toContain("activationStage");
    expect(contract).toContain("navigationProfile");
  });
});
