"use client";

import { signIn, signOut } from "next-auth/react";

import type { PortfolioSession } from "@/lib/auth/types";
import { RoleBadge } from "@/components/RoleBadge";

type Provider = "google" | "github";

type AuthControlsProps = {
  session: PortfolioSession | null;
  onSignIn?: (provider: Provider) => void;
  onSignOut?: () => void;
};

export function AuthControls({ session, onSignIn, onSignOut }: AuthControlsProps) {
  if (!session) {
    const handleSignIn = (provider: Provider) => {
      if (onSignIn) {
        onSignIn(provider);
        return;
      }

      void signIn(provider);
    };

    return (
      <div className="flex flex-wrap gap-2" aria-label="Sign in options">
        <button type="button" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-paper" onClick={() => handleSignIn("google")}>
          Sign in with Google
        </button>
        <button type="button" className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink" onClick={() => handleSignIn("github")}>
          Sign in with GitHub
        </button>
      </div>
    );
  }

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
      return;
    }

    void signOut();
  };

  return (
    <div className="flex items-center gap-3" aria-label="Signed in account">
      <div className="text-right">
        <p className="text-sm font-semibold text-ink">{session.user?.name ?? session.user?.email ?? "Signed-in user"}</p>
        <RoleBadge role={session.role} />
      </div>
      <button type="button" className="rounded-full border border-ink/20 px-3 py-2 text-sm font-semibold text-ink" onClick={handleSignOut}>
        Sign out
      </button>
    </div>
  );
}
