import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US9 governance admin contract", () => {
  it("admin page exposes compliance controls and audit explorer", () => {
    const source = readFileSync(
      path.resolve(testDir, "../../frontend/orbit-web/src/pages/admin/ComplianceDashboardPage.tsx"),
      "utf8"
    );
    expect(source).toContain("AuditEventExplorer");
    expect(source).toContain("PolicyControlForms");
  });

  it("gateway governance endpoint exists", () => {
    const source = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/admin/GovernanceAdminController.java"
      ),
      "utf8"
    );
    expect(source).toContain("@RequestMapping(\"/api/admin/governance\")");
    expect(source).toContain("@PostMapping(\"/retention-rules\")");
    expect(source).toContain("@PostMapping(\"/ai-controls\")");
  });
});

