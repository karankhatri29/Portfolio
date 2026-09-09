import type { Role } from "@/lib/auth/types";

export function RoleBadge({ role }: { role: Role }) {
  return <span className="rounded-full border border-accent/40 px-2 py-1 text-xs font-semibold text-accent">{role}</span>;
}
