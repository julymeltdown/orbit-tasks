import { describe, expect, it } from "vitest";
import { isProfileComplete } from "@/lib/auth/profileCompletion";

describe("isProfileComplete", () => {
  it("returns true when username/nickname/avatar/bio are all filled", () => {
    expect(
      isProfileComplete({
        username: "orbit_user",
        nickname: "Orbit User",
        avatarUrl: "https://example.com/avatar.png",
        bio: "I ship schedules."
      })
    ).toBe(true);
  });

  it("returns false when at least one required field is blank", () => {
    expect(
      isProfileComplete({
        username: "orbit_user",
        nickname: "",
        avatarUrl: "https://example.com/avatar.png",
        bio: "I ship schedules."
      })
    ).toBe(false);
  });
});

