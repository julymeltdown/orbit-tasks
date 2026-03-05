import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US3 insights explainability contract", () => {
  it("gateway evaluation response includes fallback and reason for explainable UI", () => {
    const controller = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ScheduleEvaluationController.java"
      ),
      "utf8"
    );

    expect(controller).toContain("boolean fallback");
    expect(controller).toContain("String reason");
    expect(controller).toContain("normalizeReason");
  });
});
