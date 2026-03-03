import { describe, expect, it } from "vitest";
import { resolveErrorMessage } from "./errorMapper";

describe("errorMapper.resolveErrorMessage", () => {
  it("maps known backend messages", () => {
    expect(resolveErrorMessage(new Error("Invalid credentials"))).toBe(
      "아이디 또는 비밀번호가 올바르지 않습니다."
    );
  });

  it("normalizes HTML error payloads", () => {
    expect(resolveErrorMessage(new Error("<!DOCTYPE html><html><body>404</body></html>"))).toBe(
      "API 응답 형식이 올바르지 않습니다. API 도메인 및 CORS 설정을 확인해 주세요."
    );
  });

  it("normalizes route-not-found text payloads", () => {
    expect(resolveErrorMessage(new Error("This page does not exist. Try another route."))).toBe(
      "요청 경로를 찾지 못했습니다. API 베이스 URL 설정을 확인해 주세요."
    );
  });
});
