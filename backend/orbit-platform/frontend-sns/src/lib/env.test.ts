import { describe, expect, it } from "vitest";
import { resolveApiBase } from "./env";

describe("env.resolveApiBase", () => {
  it("falls back to default API base when configured value is missing", () => {
    expect(resolveApiBase(undefined)).toBe("https://tasksapi.infinitefallcult.trade");
    expect(resolveApiBase("")).toBe("https://tasksapi.infinitefallcult.trade");
    expect(resolveApiBase("   ")).toBe("https://tasksapi.infinitefallcult.trade");
  });

  it("keeps configured https API base", () => {
    expect(resolveApiBase("https://api.example.com", "https:")).toBe("https://api.example.com");
  });

  it("upgrades http API base to https under https pages", () => {
    expect(resolveApiBase("http://api.example.com", "https:")).toBe("https://api.example.com");
  });
});
