import { describe, expect, it } from "vitest";

function evaluate(confidence: number, schemaValid: boolean) {
  if (!schemaValid) {
    return { fallback: true, reason: "schema_invalid" };
  }
  if (confidence < 0.55) {
    return { fallback: true, reason: "low_confidence" };
  }
  return { fallback: false, reason: "ok" };
}

describe("US8 AI fallback and confidence gate", () => {
  it("falls back when schema validation fails", () => {
    const result = evaluate(0.88, false);
    expect(result.fallback).toBe(true);
    expect(result.reason).toBe("schema_invalid");
  });

  it("falls back when confidence is below threshold", () => {
    const result = evaluate(0.4, true);
    expect(result.fallback).toBe(true);
    expect(result.reason).toBe("low_confidence");
  });

  it("returns normal response when confidence is adequate", () => {
    const result = evaluate(0.72, true);
    expect(result.fallback).toBe(false);
    expect(result.reason).toBe("ok");
  });
});
