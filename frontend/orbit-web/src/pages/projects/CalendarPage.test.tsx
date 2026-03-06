import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("CalendarPage", () => {
  it("renders FullCalendar month grid instead of date-grouped list", () => {
    const source = readFileSync(path.resolve(testDir, "./CalendarPage.tsx"), "utf8");
    expect(source).toContain("FullCalendar");
    expect(source).toContain("dayGridPlugin");
    expect(source).toContain("initialView=\"dayGridMonth\"");
  });

  it("keeps unscheduled work items visible outside the calendar grid", () => {
    const source = readFileSync(path.resolve(testDir, "./CalendarPage.tsx"), "utf8");
    expect(source).toContain("미배치 작업");
    expect(source).toContain("unscheduledItems");
    expect(source).toContain("selectedItem");
  });
});
