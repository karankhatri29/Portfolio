import { validateContactInput } from "@/lib/contact/validation";

describe("validateContactInput", () => {
  const valid = { name: " Ada ", email: "ada@example.com", message: "Hello, I would like to talk about a role." };

  it("trims and accepts a valid message", () => {
    expect(validateContactInput(valid)).toEqual({ valid: true, data: { ...valid, name: "Ada" } });
  });

  it("collects every problem", () => {
    const result = validateContactInput({ name: "", email: "nope", message: "short" });
    expect(result).toEqual({
      valid: false,
      errors: ["name is required", "email must be a valid address", "message must be at least 10 characters"],
    });
  });

  it("rejects oversized fields and non-objects", () => {
    expect(validateContactInput({ ...valid, message: "x".repeat(2001) }).valid).toBe(false);
    expect(validateContactInput({ ...valid, name: "n".repeat(101) }).valid).toBe(false);
    expect(validateContactInput(null).valid).toBe(false);
  });
});
