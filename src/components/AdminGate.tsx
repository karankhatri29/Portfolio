import type { PortfolioSession } from "@/lib/auth/types";

export function AdminGate({ children, session }: { children: React.ReactNode; session: PortfolioSession | null }) {
  if (session?.role === "Admin") {
    return <>{children}</>;
  }

  return (
    <p role="status" className="border border-accent/30 bg-paper/70 p-4 text-sm text-muted">
      {session ? "Admin access required for this area." : "Please sign in to access this area."}
    </p>
  );
}
