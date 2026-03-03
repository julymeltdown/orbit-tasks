import { describe, expect, it } from "vitest";

function rank(candidates: Array<{ project: string; risk: number }>) {
  return [...candidates].sort((a, b) => b.risk - a.risk).map((item) => item.project);
}

describe("US9 escalation ranking", () => {
  it("sorts highest risk projects first", () => {
    const result = rank([
      { project: "Growth", risk: 37 },
      { project: "Payments", risk: 82 },
      { project: "Infra", risk: 63 }
    ]);

    expect(result).toEqual(["Payments", "Infra", "Growth"]);
  });
});
