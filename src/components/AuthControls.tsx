"use client";

import { useEffect, useRef, useState } from "react";
import { signIn, signOut } from "next-auth/react";

import type { PortfolioSession } from "@/lib/auth/types";
import { RoleBadge } from "@/components/RoleBadge";

type Provider = "google" | "github";

type AuthControlsProps = {
  session: PortfolioSession | null;
  onSignIn?: (provider: Provider) => void;
  onSignOut?: () => void;
};

const pill = "rounded-full border border-ink/20 px-3 py-2 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";

function SignInMenu({ onSelect }: { onSelect: (provider: Provider) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (provider: Provider) => {
    setOpen(false);
    onSelect(provider);
  };

  return (
    <div ref={root} className="relative" aria-label="Sign in options" role="group">
      <button ref={trigger} type="button" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-paper transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper">
        Sign in
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-20 mt-2 w-52 border border-ink/15 bg-paper p-1.5 shadow-xl shadow-black/30">
          <button type="button" autoFocus className="block w-full px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-ink/5 hover:text-accent focus:outline-none focus-visible:bg-ink/5" onClick={() => choose("google")}>
            Continue with Google
          </button>
          <button type="button" className="block w-full px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-ink/5 hover:text-accent focus:outline-none focus-visible:bg-ink/5" onClick={() => choose("github")}>
            Continue with GitHub
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function AuthControls({ session, onSignIn, onSignOut }: AuthControlsProps) {
  if (!session) {
    const handleSignIn = (provider: Provider) => {
      if (onSignIn) {
        onSignIn(provider);
        return;
      }

      void signIn(provider);
    };

    return <SignInMenu onSelect={handleSignIn} />;
  }

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
      return;
    }

    void signOut();
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3" aria-label="Signed in account">
      <div className="flex items-center gap-2 text-right sm:block">
        <p className="hidden text-sm font-semibold text-ink sm:block">{session.user?.name ?? session.user?.email ?? "Signed-in user"}</p>
        <RoleBadge role={session.role} />
      </div>
      <button type="button" className={pill} onClick={handleSignOut}>
        Sign out
      </button>
    </div>
  );
}
