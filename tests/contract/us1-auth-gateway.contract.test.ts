import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe("US1 Auth gateway contract", () => {
  it("contains login/refresh/logout contract routes", () => {
    const routeContractPath = path.resolve(
      testDir,
      "../../backend/orbit-platform/services/api-gateway/src/main/resources/contracts/route-contracts.yml"
    );
    const contracts = readFileSync(
      routeContractPath,
      "utf8"
    );

    expect(contracts).toContain("/auth/login");
    expect(contracts).toContain("/auth/refresh");
    expect(contracts).toContain("/auth/logout");
  });

  it("defines identity workspace claim grpc contract", () => {
    const identityProtoPath = path.resolve(
      testDir,
      "../../backend/orbit-platform/services/api-gateway/src/main/proto/identity/v1/identity.proto"
    );
    const proto = readFileSync(
      identityProtoPath,
      "utf8"
    );

    expect(proto).toContain("service IdentityAccessService");
    expect(proto).toContain("rpc GetWorkspaceClaims");
  });
});
