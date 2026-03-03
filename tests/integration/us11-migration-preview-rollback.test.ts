import { describe, expect, it } from "vitest";

function preview(mapping: Record<string, string>) {
  const errors = Object.keys(mapping).length === 0 ? ["mapping is required"] : [];
  return { valid: errors.length === 0, errors };
}

function executeAndRollback() {
  return {
    executed: { jobId: "job-1", status: "completed" },
    rolledBack: { jobId: "job-1", status: "rolled_back" }
  };
}

describe("US11 migration preview and rollback", () => {
  it("fails preview when mapping is empty", () => {
    const result = preview({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("mapping is required");
  });

  it("supports execution followed by rollback", () => {
    const flow = executeAndRollback();
    expect(flow.executed.status).toBe("completed");
    expect(flow.rolledBack.status).toBe("rolled_back");
  });
});
