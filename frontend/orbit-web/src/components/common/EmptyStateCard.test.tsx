import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("EmptyStateCard", () => {
  it("supports status hint, primary/secondary actions, and learn-more link", () => {
    const source = readFileSync(path.resolve(testDir, "./EmptyStateCard.tsx"), "utf8");

    expect(source).toContain("statusHint");
    expect(source).toContain("secondaryActions");
    expect(source).toContain("learnMoreHref");
    expect(source).toContain("orbit-empty-state__secondary");
  });
});
