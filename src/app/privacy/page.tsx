import type { Metadata } from "next";
import Link from "next/link";

import { portfolioContent } from "@/data/portfolio";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What this site records about visitors, and what it does not.",
  alternates: { canonical: "/privacy" },
};

const email = portfolioContent.contactLinks.find((link) => link.icon === "email")?.href.replace("mailto:", "");

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-20 lg:px-8 lg:py-32">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Privacy</p>
      <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight">Your privacy on this site</h1>
      <p className="mt-6 text-lg leading-8 text-muted">Short version: I count visits so I can see what is useful. I do not use cookies for tracking, I do not store your IP address, and I do not sell or share anything.</p>

      <section aria-labelledby="visits" className="mt-14">
        <h2 id="visits" className="font-display text-2xl font-semibold">What is counted when you visit</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-muted">
          <li>The page you viewed, the site you came from, and the link name if the address had <code>?ref=</code> on it.</li>
          <li>Your country and city (approximate, provided by the hosting network), your device type and browser name.</li>
          <li>For blog posts, how long the page was open and how far you scrolled.</li>
          <li>Whether you clicked a contact link.</li>
          <li>A one-way scrambled code built from your network address and browser, mixed with a secret and changing every day, used only to count unique visitors. Your real address is never stored, and the code cannot be traced back to you or linked across days.</li>
          <li>A yes/no flag in your browser saying you have visited before, so returning visitors can be counted. It contains nothing that identifies you.</li>
        </ul>
        <p className="mt-4 leading-7 text-muted">If your browser sends a Do Not Track or Global Privacy Control signal, nothing is recorded. Signed-in site owner visits are not counted.</p>
      </section>

      <section aria-labelledby="messages" className="mt-12">
        <h2 id="messages" className="font-display text-2xl font-semibold">If you send a message</h2>
        <p className="mt-4 leading-7 text-muted">The name, email address and message you type into the contact form are stored so I can reply, together with the same kind of daily scrambled code described above, which is used only to limit spam. I use them for nothing else. To have a message deleted, email me{email ? <> at <a href={`mailto:${email}`} className="text-accent underline underline-offset-4">{email}</a></> : null}.</p>
      </section>

      <section aria-labelledby="errors" className="mt-12">
        <h2 id="errors" className="font-display text-2xl font-semibold">Errors</h2>
        <p className="mt-4 leading-7 text-muted">If a page breaks, the error message and the page address (without any query string) are logged so I can fix it. No personal details are attached.</p>
      </section>

      <section aria-labelledby="signin" className="mt-12">
        <h2 id="signin" className="font-display text-2xl font-semibold">Signing in</h2>
        <p className="mt-4 leading-7 text-muted">Sign-in exists only for the site owner. It uses Google or GitHub and sets a session cookie that is needed for the login to work.</p>
      </section>

      <p className="mt-16"><Link href="/" className="text-sm font-semibold text-accent underline underline-offset-4">Back to home</Link></p>
    </main>
  );
}
