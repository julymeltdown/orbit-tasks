import { describe, expect, it } from "vitest";

function normalizeDsu(raw: string) {
  const lower = raw.toLowerCase();
  const blocked =
    lower.includes("blocked") ||
    lower.includes("blocker") ||
    lower.includes("대기") ||
    lower.includes("승인");

  return {
    statusSignal: blocked ? "blocked" : "on_track",
    blockerCount: blocked ? 1 : 0,
    asks: blocked ? ["승인 ETA 확인", "대응 플랜 작성"] : ["다음 작업 확정"]
  };
}

describe("US5 DSU pipeline", () => {
  it("extracts blocker signal from mixed language DSU", () => {
    const result = normalizeDsu("오늘: QA 진행. 블로커: 인프라 승인 대기");

    expect(result.statusSignal).toBe("blocked");
    expect(result.blockerCount).toBe(1);
    expect(result.asks).toContain("승인 ETA 확인");
  });

  it("returns on_track when no blocker token is found", () => {
    const result = normalizeDsu("어제: 구현 완료. 오늘: 테스트 예정");

    expect(result.statusSignal).toBe("on_track");
    expect(result.blockerCount).toBe(0);
  });
});
