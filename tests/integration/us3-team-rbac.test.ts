import { describe, expect, it } from "vitest";

function canMutateRole(actorRole: string): boolean {
  return actorRole === "WORKSPACE_ADMIN" || actorRole === "TEAM_ADMIN";
}

describe("US3 team RBAC", () => {
  it("allows only admin roles to mutate team roles", () => {
    expect(canMutateRole("WORKSPACE_ADMIN")).toBe(true);
    expect(canMutateRole("TEAM_ADMIN")).toBe(true);
    expect(canMutateRole("TEAM_MEMBER")).toBe(false);
  });
});
