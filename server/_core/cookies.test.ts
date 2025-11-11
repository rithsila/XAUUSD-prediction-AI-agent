import { describe, it, expect } from "vitest";
import type { Request } from "express";
import { getSessionCookieOptions } from "./cookies";

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    protocol: "http",
    headers: {},
    ...overrides,
  } as unknown as Request;
}

describe("getSessionCookieOptions", () => {
  it("uses secure + sameSite=none for https requests", () => {
    const req = mockReq({ protocol: "https" });
    const opts = getSessionCookieOptions(req);
    expect(opts.secure).toBe(true);
    expect(opts.sameSite).toBe("none");
    expect(opts.httpOnly).toBe(true);
    expect(opts.path).toBe("/");
  });

  it("detects https via x-forwarded-proto header", () => {
    const req = mockReq({ headers: { "x-forwarded-proto": "http, https" } as any });
    const opts = getSessionCookieOptions(req);
    expect(opts.secure).toBe(true);
    expect(opts.sameSite).toBe("none");
  });

  it("uses non-secure + sameSite=lax for http requests", () => {
    const req = mockReq({ protocol: "http" });
    const opts = getSessionCookieOptions(req);
    expect(opts.secure).toBe(false);
    expect(opts.sameSite).toBe("lax");
    expect(opts.httpOnly).toBe(true);
  });
});