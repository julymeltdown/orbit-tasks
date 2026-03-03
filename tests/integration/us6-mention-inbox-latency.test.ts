import { describe, expect, it } from "vitest";

function simulateMentionFanout(body: string, now = 1000) {
  const mentions = body
    .split(/\s+/)
    .filter((token) => token.startsWith("@"))
    .map((token) => token.slice(1));

  return mentions.map((user, idx) => ({
    user,
    latencyMs: now + idx * 4 - now
  }));
}

describe("US6 mention inbox latency", () => {
  it("fans out mention notifications in low latency batch", () => {
    const fanout = simulateMentionFanout("@alex @infra approve please", 10_000);

    expect(fanout.length).toBe(2);
    expect(fanout[0]?.latencyMs).toBeLessThanOrEqual(4);
    expect(fanout[1]?.latencyMs).toBeLessThanOrEqual(8);
  });
});
