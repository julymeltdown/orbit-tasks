import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US3 guided core workflow integration", () => {
  it("wires guided empty states into board, sprint, insights, inbox, and workspace", () => {
    const board = readFileSync(path.resolve(testDir, "../../frontend/orbit-web/src/pages/projects/BoardPage.tsx"), "utf8");
    const sprint = readFileSync(path.resolve(testDir, "../../frontend/orbit-web/src/pages/sprint/SprintWorkspacePage.tsx"), "utf8");
    const insights = readFileSync(path.resolve(testDir, "../../frontend/orbit-web/src/pages/insights/ScheduleInsightsPage.tsx"), "utf8");
    const inbox = readFileSync(path.resolve(testDir, "../../frontend/orbit-web/src/pages/inbox/InboxPage.tsx"), "utf8");
    const workspace = readFileSync(path.resolve(testDir, "../../frontend/orbit-web/src/pages/workspace/WorkspaceEntryPage.tsx"), "utf8");

    expect(board).toContain('getGuidedEmptyState("BOARD")');
    expect(sprint).toContain('getGuidedEmptyState("SPRINT")');
    expect(insights).toContain('getGuidedEmptyState("INSIGHTS")');
    expect(inbox).toContain('getGuidedEmptyState("INBOX")');
    expect(workspace).toContain('getGuidedEmptyState("WORKSPACE_SELECT")');
  });
});
