# Manual To-Do (things only you can do)

Last updated: 2026-09-23. Priority: **P0** = do before deploying, **P1** = do right after deploying, **P2** = cleanup, **P3** = nice to have.

Status key: `[ ]` open, `[x]` done.

---

## P0 - Before you deploy

### [ ] 1. Rotate the Neon database password
The connection string was pasted into a chat, so treat it as leaked.
1. Neon console (or Vercel > Storage > your Neon DB > Open in Neon) > **Roles** > `neondb_owner` > **Reset password**.
2. Vercel updates its linked env vars automatically if the DB was connected via the Vercel integration. Confirm under Vercel > Project > Settings > Environment Variables that `DATABASE_URL` changed (or re-save it).
3. Update your local `.env.local`: replace the `DATABASE_URL=` line with the new pooled connection string (`vercel env pull .env.local` also works, but back up `.env.local` first because it overwrites the file).
4. Check it works: `npm run db:migrate` should print "already has N rows, skipping seed."

### [ ] 2. Set the auth env vars on Vercel
Vercel > Project > Settings > Environment Variables. Add for **Production** (and Preview if you use it):
- `AUTH_SECRET` - generate one with `npx auth secret` or `openssl rand -base64 32`
- `AUTH_OWNER_EMAIL` - the exact email you sign in with; this is what makes you Admin
- `AUTH_TRUST_HOST=true`
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` (if using Google)
- `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` (if using GitHub)
- `DATABASE_URL` - should already exist from the Neon integration; confirm it is enabled for Production.

### [ ] 2b. Run the analytics migration (already done locally; prod uses the same Neon DB)
The analytics feature added two tables (`events`, `contact_messages`). They were created in your Neon database when Claude ran `npm run db:migrate`, and Vercel uses that same database, so nothing more is needed unless you switch to a different database or a Neon branch. If you ever do: run `npm run db:migrate` against it first.

### [ ] 3. Add your production URL to the OAuth apps
Sign-in will fail on the live site until the callback URLs include it.
- **Google** (console.cloud.google.com > APIs & Services > Credentials > your OAuth client): add Authorized redirect URI `https://YOUR-DOMAIN/api/auth/callback/google`
- **GitHub** (Settings > Developer settings > OAuth Apps > your app): set the callback URL to `https://YOUR-DOMAIN/api/auth/callback/github` (GitHub allows one, so use a separate app for local vs prod, or switch it when testing).
- Local dev callbacks use `http://localhost:3000/api/auth/callback/<provider>`.

### [ ] 4. Review and commit the changes
Nothing is committed yet. Run `git status` and check it before committing.
- Phase 5 work: `package.json`, `package-lock.json`, `.env.example`, `src/proxy.ts` (moved from `middleware.ts`), `src/app/admin/`, `src/app/api/projects/`, `src/app/api/skills/`, `src/lib/content/`, `src/components/ContentEditor*`, `scripts/`, the edited pages/components/tests, `specs/.../plan.md`, this `TODO.md`.
- Do **not** commit `.env.local` (it is gitignored; confirm it does not show in `git status`).
- Decide on `AGENTS.md` and `CLAUDE.md` (untracked; AGENTS.md says committing it keeps the tree clean).
- Decide on `.claude/` (untracked, local tool settings): commit it or add it to `.gitignore`.
- Ask Claude to do the commit if you want (one commit or split into several).

---

## P1 - Right after deploying

### [ ] 5. Smoke test the live site
1. Open the deployed home page: projects and competencies should show.
2. Sign in with the account matching `AUTH_OWNER_EMAIL`.
3. Go to `/admin`. You should see the editor. A different account or a signed-out browser should be redirected to `/`.
4. Create a test project, edit it, then delete it. Confirm each change appears on `/` and `/projects/<slug>` immediately, with no redeploy.
5. Add a test competency, edit it, delete it.
6. If anything fails, check Vercel > Deployments > Functions logs and send the error to Claude.

### [ ] 5b. Smoke test analytics on the live site
1. In a private/incognito window (signed out), open your site, click around, open a blog post, click a contact link, and send a test message through the contact form.
2. Sign in as the owner, open `/admin/analytics` (or the "Dashboard" link in the header). Within a minute you should see the views, the blog post, the contact click and the message.
3. Mark the test message "Replied" or "Archived" to confirm the inbox buttons work, then archive it.
4. Your own signed-in visits are deliberately not counted; if you want to test as a visitor, use incognito or another browser.
5. Try `https://YOUR-DOMAIN/?ref=linkedin-test` in incognito and check it appears under "Where visitors come from".
6. Delete test rows if you want a clean start: in Neon SQL editor run `DELETE FROM events; DELETE FROM contact_messages;`

### [ ] 6. Check the Neon free-tier behavior
Neon databases pause when idle, so the first request after a quiet period can take a couple of seconds. If that bothers you, nothing to fix now; just know it is expected.

---

## P2 - Cleanup decisions

### [ ] 7. Unexpected Speckit changes in your working tree
Present since the start of the session, not made by Claude: deleted `.github/skills/*` and `.specify/integrations/copilot.manifest.json`; modified `.specify/init-options.json` and `.specify/integration.json`; new `.specify/integrations/claude.manifest.json`. This looks like Speckit switching from the Copilot integration to Claude.
- If you ran a Speckit setup/upgrade command: keep these and commit them in their own commit.
- If not: `git restore .github .specify` reverts them (check `git status` first so you don't lose anything you want).

### [ ] 8. Personal contact details in source code
`src/data/portfolio.ts` contains your phone number and Gmail address in git history and on the public site. If you would rather not publish the phone number, remove that entry from `contactLinks` (ask Claude to do it).

### [ ] 9. Two stale tests that were already failing
Not caused by Phase 5, but they keep the test run red:
- `src/components/CareerTimeline.test.tsx` expects "2024 - now" and "Independent engineer"; your real timeline data changed.
- `src/app/blog/[slug]/page.test.tsx` fails on an exact text match against the mocked Markdown output.
Ask Claude to fix them.

---

## P3 - Later

### [ ] 10. Manual responsive and accessibility review (plan tasks T028/T029, Phase 6)
Check the site at 375px, 768px and 1440px wide, and try keyboard-only navigation (Tab through the page, the admin forms and the delete confirmation). Record the results in `specs/001-authenticated-portfolio/quickstart.md`, which is out of date.

### [ ] 11. Update the stale spec docs
`plan.md` Phase 4 checkboxes are still unchecked even though the blog is built. Ask Claude to reconcile them.

### [ ] 13. Decide how you want to be told about new messages
Right now messages only appear in the dashboard, so you have to open `/admin/analytics` to see them (unread count shows in the summary). If you want an email when someone writes, tell Claude: it needs a mail service account (for example Resend, free tier) and an API key added to Vercel as an env var. Until then, check the dashboard regularly.

### [ ] 14. Add a short privacy note to the site (recommended)
The site now records page views without cookies and stores contact messages. A one-line note near the contact form or footer, such as "This site counts page views without cookies or personal identifiers. Messages you send are stored so I can reply.", is good practice. Ask Claude to add it.

### [ ] 15. Optional: data cleanup schedule
Raw events grow over time. Neon's free tier is generous, but every few months you can delete old rows in the Neon SQL editor: `DELETE FROM events WHERE created_at < now() - interval '180 days';`. Ask Claude if you want this automated.

---

## Done
- [x] Neon database created and linked
- [x] `DATABASE_URL` added to local `.env.local`
- [x] Tables created and seeded (`npm run db:migrate`)
- [x] Analytics tables (`events`, `contact_messages`) created in Neon
