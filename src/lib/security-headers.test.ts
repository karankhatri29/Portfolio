import { contentSecurityPolicy, securityHeaders } from "@/lib/security-headers";

describe("contentSecurityPolicy", () => {
  it("locks the production policy to same-origin with no eval and no framing", () => {
    const policy = contentSecurityPolicy(false);

    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("upgrade-insecure-requests");
    expect(policy).not.toContain("unsafe-eval");
    expect(policy).toContain("connect-src 'self'");
    expect(policy).not.toContain("ws:");
  });

  it("only loosens eval and websockets for local development", () => {
    const policy = contentSecurityPolicy(true);

    expect(policy).toContain("'unsafe-eval'");
    expect(policy).toContain("ws:");
    expect(policy).not.toContain("upgrade-insecure-requests");
  });
});

describe("securityHeaders", () => {
  const byKey = (isDev: boolean) => Object.fromEntries(securityHeaders(isDev).map((header) => [header.key, header.value]));

  it("sets the standard hardening headers in production including HSTS", () => {
    const headers = byKey(false);

    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
    expect(headers["Strict-Transport-Security"]).toContain("max-age=31536000");
  });

  it("does not send HSTS during local development", () => {
    expect(byKey(true)["Strict-Transport-Security"]).toBeUndefined();
  });
});
