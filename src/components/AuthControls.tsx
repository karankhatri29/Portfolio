"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { signIn, signOut } from "next-auth/react";

import type { PortfolioSession } from "@/lib/auth/types";
import { RoleBadge } from "@/components/RoleBadge";

type Provider = "google" | "github";

type AuthControlsProps = {
  session: PortfolioSession | null;
  onSignIn?: (provider: Provider) => void;
  onSignOut?: () => void;
};

const menuItem = "block w-full px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-ink/5 hover:text-accent focus:outline-none focus-visible:bg-ink/5 focus-visible:text-accent";

/** Closes a popover on Escape (returning focus to its trigger) or on a press outside it. */
function useDismiss(open: boolean, close: () => void, root: React.RefObject<HTMLElement | null>, trigger: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: Event) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close, root, trigger]);
}

function SignInMenu({ onSelect }: { onSelect: (provider: Provider) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useDismiss(open, () => setOpen(false), root, trigger);

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
          <button type="button" autoFocus className={menuItem} onClick={() => choose("google")}>
            Continue with Google
          </button>
          <button type="button" className={menuItem} onClick={() => choose("github")}>
            Continue with GitHub
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function initialsOf(name?: string | null, email?: string | null) {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length) return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  return (email?.trim()[0] ?? "?").toUpperCase();
}

function Avatar({ image, initials, size }: { image?: string | null; initials: string; size: "sm" | "lg" }) {
  const [failed, setFailed] = useState(false);
  const box = size === "lg" ? "h-11 w-11 text-sm" : "h-9 w-9 text-xs";
  if (image && !failed) {
    // Profile pictures come from the sign-in provider's host, so a plain img avoids per-host image config.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} className={`${box} shrink-0 rounded-full object-cover`} />;
  }
  return <span aria-hidden="true" className={`${box} flex shrink-0 items-center justify-center rounded-full bg-accent/15 font-semibold text-accent`}>{initials}</span>;
}

function AccountMenu({ session, onSignOut }: { session: PortfolioSession; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  useDismiss(open, () => setOpen(false), root, trigger);

  // React's autoFocus only applies to form controls, so move focus to the first item (a link for admins) by hand.
  useEffect(() => {
    if (open) document.getElementById(panelId)?.querySelector<HTMLElement>("a, button")?.focus();
  }, [open, panelId]);

  const { name, email, image } = session.user ?? {};
  const display = name?.trim() || email || "Signed-in user";
  const firstName = display.split(/\s+/)[0];
  const initials = initialsOf(name, email);
  const isAdmin = session.role === "Admin";

  return (
    <div ref={root} className="relative" role="group" aria-label="Signed in account">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`Account menu, signed in as ${display}`}
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-1 transition hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:pr-3 ${isAdmin ? "border-accent/50" : "border-ink/20"}`}
      >
        <Avatar image={image} initials={initials} size="sm" />
        <span className="hidden text-sm font-semibold sm:inline">{firstName}</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={`hidden h-3.5 w-3.5 text-muted transition-transform sm:block ${open ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div id={panelId} className="absolute right-0 top-full z-20 mt-2 w-64 border border-ink/15 bg-paper shadow-xl shadow-black/30">
          <div className="flex items-center gap-3 p-4">
            <Avatar image={image} initials={initials} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{display}</p>
              {email && email !== display ? <p className="truncate text-xs text-muted">{email}</p> : null}
              <div className="mt-1.5"><RoleBadge role={session.role} /></div>
            </div>
          </div>

          {isAdmin ? (
            <nav aria-label="Admin" className="border-t border-ink/10 p-1.5">
              <Link href="/admin" className={menuItem} onClick={() => setOpen(false)}>Manage content</Link>
              <Link href="/admin/analytics" className={menuItem} onClick={() => setOpen(false)}>Analytics</Link>
              <Link href="/admin/blog" className={menuItem} onClick={() => setOpen(false)}>Blog posts</Link>
            </nav>
          ) : null}

          <div className="border-t border-ink/10 p-1.5">
            <button type="button" className={menuItem} onClick={() => { setOpen(false); onSignOut(); }}>
              Sign out
            </button>
          </div>
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

  return <AccountMenu session={session} onSignOut={handleSignOut} />;
}
