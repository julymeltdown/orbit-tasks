import { describe, expect, it } from "vitest";
import { isProfileComplete } from "@/lib/auth/profileCompletion";

describe("isProfileComplete", () => {
  it("returns true when username and nickname are filled", () => {
    expect(
      isProfileComplete({
        username: "orbit_user",
        nickname: "Orbit User"
      })
    ).toBe(true);
  });

  it("returns false when at least one required field is blank", () => {
    expect(
      isProfileComplete({
        username: "orbit_user",
        nickname: ""
      })
    ).toBe(false);
  });
});
