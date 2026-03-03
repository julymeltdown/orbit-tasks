import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US9 portfolio contract", () => {
  it("gateway exposes portfolio overview and report endpoints", () => {
    const source = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/PortfolioController.java"
      ),
      "utf8"
    );

    expect(source).toContain("@RequestMapping(\"/api/portfolio\")");
    expect(source).toContain("@PostMapping(\"/overview\")");
    expect(source).toContain("@GetMapping(\"/monthly-report\")");
  });

  it("schedule intelligence includes portfolio projection migration", () => {
    const migration = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/schedule-intelligence-service/src/main/resources/db/migration/V2__portfolio_projection.sql"
      ),
      "utf8"
    );

    expect(migration).toContain("portfolio_projections");
    expect(migration).toContain("portfolio_escalation_candidates");
  });
});
