import { describe, expect, it } from "vitest";

function evaluatePolicy(input: {
  enabled: boolean;
  requireStoreFalse: boolean;
  storeEnabled: boolean;
  maxTokensPerCall: number;
  estimatedTokens: number;
}) {
  if (!input.enabled) return "blocked";
  if (input.requireStoreFalse && input.storeEnabled) return "blocked";
  if (input.maxTokensPerCall > 0 && input.estimatedTokens > input.maxTokensPerCall) return "blocked";
  return "allowed";
}

describe("US10 AI policy enforcement", () => {
  it("blocks when store:false policy is violated", () => {
    const result = evaluatePolicy({
      enabled: true,
      requireStoreFalse: true,
      storeEnabled: true,
      maxTokensPerCall: 4000,
      estimatedTokens: 1000
    });

    expect(result).toBe("blocked");
  });

  it("allows request when policy constraints are satisfied", () => {
    const result = evaluatePolicy({
      enabled: true,
      requireStoreFalse: true,
      storeEnabled: false,
      maxTokensPerCall: 4000,
      estimatedTokens: 2500
    });

    expect(result).toBe("allowed");
  });
});
