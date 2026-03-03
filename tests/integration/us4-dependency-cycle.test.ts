import { describe, expect, it } from "vitest";

function wouldCreateCycle(edges: Array<[string, string]>, next: [string, string]): boolean {
  const graph = new Map<string, string[]>();
  for (const [from, to] of [...edges, next]) {
    graph.set(from, [...(graph.get(from) ?? []), to]);
  }

  const [start] = next;
  const seen = new Set<string>();
  const stack = [start];

  while (stack.length > 0) {
    const node = stack.pop()!;
    if (seen.has(node)) continue;
    seen.add(node);
    for (const to of graph.get(node) ?? []) {
      if (to === start) return true;
      stack.push(to);
    }
  }

  return false;
}

describe("US4 dependency cycle guard", () => {
  it("detects cyclic dependency", () => {
    const edges: Array<[string, string]> = [
      ["A", "B"],
      ["B", "C"]
    ];
    expect(wouldCreateCycle(edges, ["C", "A"])).toBe(true);
    expect(wouldCreateCycle(edges, ["C", "D"])).toBe(false);
  });
});
