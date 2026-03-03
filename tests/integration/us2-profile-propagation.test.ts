import { describe, expect, it } from "vitest";

function mentionLabel(nickname: string, presence: "online" | "focus" | "offline"): string {
  const marker = presence === "online" ? "●" : presence === "focus" ? "◆" : "○";
  return `${marker} ${nickname}`;
}

describe("US2 profile propagation", () => {
  it("updates mention surface label when presence changes", () => {
    const before = mentionLabel("Alex", "offline");
    const after = mentionLabel("Alex", "focus");

    expect(before).toBe("○ Alex");
    expect(after).toBe("◆ Alex");
  });
});
