import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US2 work-item multiview contract", () => {
  it("router exposes board/table/timeline/calendar/dashboard routes", () => {
    const routerSource = readFileSync(
      path.resolve(testDir, "../../frontend/orbit-web/src/app/router.tsx"),
      "utf8"
    );
    expect(routerSource).toContain('projects/board');
    expect(routerSource).toContain('projects/table');
    expect(routerSource).toContain('projects/timeline');
    expect(routerSource).toContain('projects/calendar');
    expect(routerSource).toContain('projects/dashboard');
  });

  it("gateway exposes project view configuration endpoints", () => {
    const controllerSource = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/ProjectViewController.java"
      ),
      "utf8"
    );
    expect(controllerSource).toContain("@GetMapping(\"/{projectId}/view-configurations\")");
    expect(controllerSource).toContain("@PostMapping(\"/{projectId}/view-configurations\")");
  });
});

