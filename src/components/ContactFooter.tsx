import type { CSSProperties } from "react";

import { ContactForm } from "@/components/ContactForm";
import type { ContactLink } from "@/data/portfolio";

type Icon = ContactLink["icon"];

// Brand glyphs (Simple Icons, CC0) for GitHub, LinkedIn and Gmail; Material "call" for phone.
const glyphs: Record<Icon, string> = {
  email: "M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z",
  github: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.921.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  linkedin: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  phone: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
};

// Brand colour applied on hover; GitHub stays neutral so it works in both themes.
const brand: Record<Icon, string> = { email: "#EA4335", github: "rgb(var(--color-ink))", linkedin: "#0A66C2", phone: "rgb(var(--color-accent))" };
const channel: Record<Icon, string> = { email: "Email", github: "GitHub", linkedin: "LinkedIn", phone: "Phone" };

function ContactIcon({ name }: { name: Icon }) {
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 shrink-0"><path d={glyphs[name]} /></svg>;
}

function display(link: ContactLink) {
  if (link.href.startsWith("mailto:")) return link.href.slice(7);
  if (link.href.startsWith("tel:")) return link.href.slice(4).replace(/^\+(\d{2})(\d{5})(\d+)$/, "+$1 $2 $3");
  return link.href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

export function ContactFooter({ links, name }: { links: ContactLink[]; name?: string }) {
  const email = links.find((link) => link.icon === "email");

  return (
    <footer id="contact" aria-labelledby="contact-title" className="border-t border-ink/10 pb-10 pt-16 lg:pt-24">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Contact</p>
        <h2 id="contact-title" className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Let&apos;s build something useful.</h2>
        <p className="mx-auto mt-5 max-w-xl leading-7 text-muted">I&apos;m open to conversations about backend engineering, data, and applied AI roles. The quickest way to reach me is email.</p>
        {email ? <a href={email.href} data-track="email" className="mt-8 inline-flex items-center gap-3 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-paper transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper">Say hello<span aria-hidden="true">→</span></a> : null}
      </div>

      <nav aria-label="Contact links" className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-3">
        {links.map((link) => {
          const external = link.href.startsWith("http");
          return (
            <a
              key={link.href}
              href={link.href}
              aria-label={link.label}
              data-track={link.icon}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              style={{ "--brand": brand[link.icon] } as CSSProperties}
              className="group flex min-w-0 items-center gap-4 border border-ink/10 p-5 transition hover:-translate-y-0.5 hover:border-[color:var(--brand)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="text-ink transition-colors group-hover:text-[color:var(--brand)]"><ContactIcon name={link.icon} /></span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-muted">{channel[link.icon]}</span>
                <span className="mt-1 block truncate text-sm font-medium">{display(link)}</span>
              </span>
              {external ? <span aria-hidden="true" className="ml-auto text-muted transition group-hover:text-[color:var(--brand)]">↗</span> : null}
            </a>
          );
        })}
      </nav>

      <div className="mx-auto mt-16 max-w-xl">
        <h3 className="font-display text-2xl font-semibold">Or send a message</h3>
        <p className="mt-2 text-sm text-muted">Goes straight to my inbox on this site. I read everything.</p>
        <div className="mt-6"><ContactForm /></div>
      </div>

      <p className="mt-16 text-center text-xs text-muted">© {new Date().getFullYear()} {name ?? ""}</p>
    </footer>
  );
}
