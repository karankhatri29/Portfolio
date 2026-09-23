export type ContactInput = { name: string; email: string; message: string };

export type ContactValidation = { valid: true; data: ContactInput } | { valid: false; errors: string[] };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateContactInput(payload: unknown): ContactValidation {
  const record = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const email = typeof record.email === "string" ? record.email.trim() : "";
  const message = typeof record.message === "string" ? record.message.trim() : "";
  const errors: string[] = [];

  if (!name) errors.push("name is required");
  else if (name.length > 100) errors.push("name must be 100 characters or fewer");

  if (!email) errors.push("email is required");
  else if (email.length > 200 || !emailPattern.test(email)) errors.push("email must be a valid address");

  if (message.length < 10) errors.push("message must be at least 10 characters");
  else if (message.length > 2000) errors.push("message must be 2000 characters or fewer");

  return errors.length > 0 ? { valid: false, errors } : { valid: true, data: { name, email, message } };
}
