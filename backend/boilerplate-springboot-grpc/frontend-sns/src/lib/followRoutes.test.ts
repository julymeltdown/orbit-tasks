import { describe, expect, it } from "vitest";
import { buildFollowListHref, buildProfileHref, normalizeFollowTab } from "./followRoutes";

describe("followRoutes", () => {
  it("builds profile href with username when available", () => {
    expect(buildProfileHref({ userId: "user-1", username: "hana_ani" }))
      .toBe("/profile?username=hana_ani");
  });

  it("builds profile href with userId when username missing", () => {
    expect(buildProfileHref({ userId: "user-1" })).toBe("/profile?userId=user-1");
  });

  it("builds follow list href with tab and username", () => {
    expect(buildFollowListHref({ userId: "user-1", username: "jin", tab: "following" }))
      .toBe("/profile/follows?username=jin&tab=following");
  });

  it("normalizes unknown tab to followers", () => {
    expect(normalizeFollowTab("unknown")).toBe("followers");
  });
});
