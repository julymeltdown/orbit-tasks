import { describe, expect, it } from "vitest";

type Stage = "NOT_STARTED" | "FIRST_ACTION_DONE" | "CORE_FLOW_CONTINUED" | "COMPLETED";

function applyActivation(stage: Stage, event: string): Stage {
  if (event === "FIRST_TASK_CREATED") {
    return "FIRST_ACTION_DONE";
  }
  if (event === "BOARD_FIRST_INTERACTION" && stage === "FIRST_ACTION_DONE") {
    return "CORE_FLOW_CONTINUED";
  }
  if (event === "INSIGHT_EVALUATION_STARTED" && stage === "CORE_FLOW_CONTINUED") {
    return "COMPLETED";
  }
  return stage;
}

describe("US3 activation foundation", () => {
  it("transitions from NOT_STARTED to FIRST_ACTION_DONE on first task creation", () => {
    expect(applyActivation("NOT_STARTED", "FIRST_TASK_CREATED")).toBe("FIRST_ACTION_DONE");
  });

  it("transitions to CORE_FLOW_CONTINUED then COMPLETED", () => {
    const first = applyActivation("NOT_STARTED", "FIRST_TASK_CREATED");
    const second = applyActivation(first, "BOARD_FIRST_INTERACTION");
    const third = applyActivation(second, "INSIGHT_EVALUATION_STARTED");
    expect(second).toBe("CORE_FLOW_CONTINUED");
    expect(third).toBe("COMPLETED");
  });
});
