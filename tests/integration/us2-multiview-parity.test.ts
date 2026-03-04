import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US2 multiview parity integration", () => {
  it("board/table/timeline/calendar/dashboard all consume ProjectFilterBar", () => {
    const targets = [
      "../../frontend/orbit-web/src/pages/projects/BoardPage.tsx",
      "../../frontend/orbit-web/src/pages/projects/TablePage.tsx",
      "../../frontend/orbit-web/src/pages/projects/TimelinePage.tsx",
      "../../frontend/orbit-web/src/pages/projects/CalendarPage.tsx",
      "../../frontend/orbit-web/src/pages/projects/DashboardPage.tsx"
    ];

    for (const target of targets) {
      const source = readFileSync(path.resolve(testDir, target), "utf8");
      expect(source).toContain("ProjectFilterBar");
    }
  });
});

