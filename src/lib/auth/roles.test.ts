import { hasRole, resolveRole } from "@/lib/auth/roles";

describe("role resolution", () => {
  it("assigns Admin only to the configured owner identity", () => {
    expect(resolveRole("owner@example.com", "owner@example.com")).toBe("Admin");
    expect(resolveRole("visitor@example.com", "owner@example.com")).toBe("Visitor");
  });

  it("fails closed for missing or unknown identities", () => {
    expect(resolveRole(undefined, "owner@example.com")).toBe("Visitor");
    expect(resolveRole("owner@example.com", undefined)).toBe("Visitor");
    expect(resolveRole("unknown@example.com", "owner@example.com")).toBe("Visitor");
  });

  it("checks the role without trusting client-provided booleans", () => {
    expect(hasRole({ role: "Admin" }, "Admin")).toBe(true);
    expect(hasRole({ role: "Visitor" }, "Admin")).toBe(false);
    expect(hasRole(null, "Admin")).toBe(false);
  });
});
