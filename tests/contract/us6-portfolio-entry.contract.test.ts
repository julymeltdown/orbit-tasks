import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US6 portfolio entry contract", () => {
  it("portfolio overview uses selector-first flow", () => {
    const source = readFileSync(
      path.resolve(testDir, "../../frontend/orbit-web/src/pages/portfolio/PortfolioOverviewPage.tsx"),
      "utf8"
    );
    expect(source).toContain("PortfolioSelector");
    expect(source).toContain("/api/portfolio/list");
  });

  it("portfolio controller exposes list endpoint", () => {
    const source = readFileSync(
      path.resolve(
        testDir,
        "../../backend/orbit-platform/services/api-gateway/src/main/java/com/example/gateway/adapters/in/web/PortfolioController.java"
      ),
      "utf8"
    );
    expect(source).toContain("@GetMapping(\"/list\")");
    expect(source).toContain("@PostMapping(\"/list\")");
  });
});

