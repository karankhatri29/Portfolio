import type { Role } from "@/lib/auth/types";

export function resolveRole(email: string | null | undefined, ownerEmail: string | null | undefined): Role {
  if (!email || !ownerEmail) {
    return "Visitor";
  }

  return email.trim().toLowerCase() === ownerEmail.trim().toLowerCase() ? "Admin" : "Visitor";
}

export function hasRole(session: { role?: Role } | null | undefined, role: Role): boolean {
  return session?.role === role;
}
