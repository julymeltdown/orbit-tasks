import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US7 AI fallback path integration", () => {
  it("schedule fallback and validator services are present", () => {
    const fallback = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/schedule-intelligence-service/src/main/java/com/orbit/schedule/application/service/FallbackAdviceService.java"
      ),
      "utf8"
    );
    const validator = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/schedule-intelligence-service/src/main/java/com/orbit/schedule/application/service/EvaluationSchemaValidator.java"
      ),
      "utf8"
    );
    expect(fallback).toContain("fallback");
    expect(validator).toContain("confidence");
    expect(validator).toContain("missing field");
  });
});

