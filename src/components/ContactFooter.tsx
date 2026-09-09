import type { ContactLink } from "@/data/portfolio";

function ContactIcon({ name }: { name: ContactLink["icon"] }) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.8, viewBox: "0 0 24 24" };
  if (name === "email") return <svg aria-hidden="true" {...common}><path d="m3 5 9 7 9-7" /><rect x="3" y="5" width="18" height="14" rx="2" /></svg>;
  if (name === "github") return <svg aria-hidden="true" {...common}><path d="M9 19c-4 1-4-2-5-2m10 4v-3.9a3.4 3.4 0 0 0-.9-2.6c3 0 6.1-1.5 6.1-6.5a5 5 0 0 0-1.3-3.5A4.6 4.6 0 0 0 17.8 4S16.5 3.6 14 5.2a13.4 13.4 0 0 0-5 0C6.5 3.6 5.2 4 5.2 4a4.6 4.6 0 0 0-.1 2.5 5 5 0 0 0-1.3 3.5c0 5 3.1 6.5 6.1 6.5a3.4 3.4 0 0 0-.9 2.6V21" /></svg>;
  return <svg aria-hidden="true" {...common}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6ZM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" /></svg>;
}

export function ContactFooter({ links }: { links: ContactLink[] }) {
  return (
    <footer aria-labelledby="contact-title" className="border-t border-ink/10 py-12">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Stay in touch</p><h2 id="contact-title" className="mt-3 font-display text-3xl font-semibold">Let&apos;s make something useful.</h2></div>
        <nav aria-label="Contact links" className="flex gap-3">
          {links.map((link) => <a key={link.href} href={link.href} aria-label={link.label} className="rounded-full border border-ink/15 p-3 text-ink transition hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent"><ContactIcon name={link.icon} /></a>)}
        </nav>
      </div>
    </footer>
  );
}
