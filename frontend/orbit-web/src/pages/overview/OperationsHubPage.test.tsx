import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("OperationsHubPage", () => {
  it("prioritizes a single primary activation CTA", () => {
    const source = readFileSync(path.resolve(testDir, "./OperationsHubPage.tsx"), "utf8");

    expect(source).toContain("Create your first task");
    expect(source).toContain("Set up your first workflow");
    expect(source).toContain("ActivationChecklist");
  });

  it("tracks activation events for primary and empty-state actions", () => {
    const source = readFileSync(path.resolve(testDir, "./OperationsHubPage.tsx"), "utf8");

    expect(source).toContain("ACTIVATION_PRIMARY_CTA_CLICKED");
    expect(source).toContain("EMPTY_STATE_ACTION_CLICKED");
  });
});
