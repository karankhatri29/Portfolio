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

### [ ] 4. Merge your work into `master` and push
All recent work is committed on the `dev` branch (not yet on `master` or GitHub). When you are happy:
1. `git switch master`, then `git merge dev`, then `git push` (or open a pull request from `dev` on GitHub; the new CI check will run on it).
2. Vercel deploys `master` to production. It now runs the database migration automatically before each build.
3. Still uncommitted and not made by Claude: `.claude/`, `AGENTS.md`, `CLAUDE.md`, the Speckit changes (item 7), and your new "ask"/terminal work (`src/app/api/ask`, `src/lib/ask`, `src/components/terminal`). Decide on each before merging.
4. Do **not** commit `.env.local` (it is gitignored).

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
6. Check the newer sections too: "Visitor journey", "Campaign links" (open `/?ref=test1` in incognito, open a project, click a contact link), "Audience" (countries and cities only appear on the live Vercel site, not on localhost), and "Avg. reading time / scroll depth" on a blog post (read it for 10+ seconds, scroll, then switch tabs or close it).
7. Delete test rows if you want a clean start: in Neon SQL editor run `DELETE FROM events; DELETE FROM contact_messages;`

### [ ] 6. Check the Neon free-tier behavior
Neon databases pause when idle, so the first request after a quiet period can take a couple of seconds. If that bothers you, nothing to fix now; just know it is expected.

### [ ] 6b. Add the GitHub repository URL for each project
Every project card has a GitHub icon at the top right. Until you set a repository URL it links to your GitHub profile (`https://github.com/karankhatri29`) as a fallback, which looks unfinished to a recruiter.
1. Sign in as the owner and open `/admin`.
2. Under **Projects**, choose **Edit** on each project and paste the exact repository link into **GitHub repository URL**. It must start with `https://github.com/` (for example `https://github.com/karankhatri29/your-repo`).
3. Save, then reload `/` and click each card's GitHub icon to confirm it opens the right repo.
4. Make sure each repository is public (or that you are happy for visitors to hit a 404 on a private one), and has a README that explains the project.
Projects to do: Edge-Native Email Triage Framework, Context-Aware Recommendation Engine, Blockchain Based Marketplace, Smart Data Compression Algorithm.

### [ ] 6c. Review the tools listed for each project and competency
The skills graph links a competency to a tool, and a tool to a project, from the **Stack** field on each project and the **Tools** field on each competency (`/admin`). Claude filled these in from your project summaries only, so they are a first guess:
- Recommendation Engine: Node.js, Google APIs
- Blockchain Marketplace: React
- Smart Data Compression: Bash, PostgreSQL
- Add anything you genuinely used (for example Python, Solidity, Docker) and remove anything you could not discuss in an interview. Names must match the tool spelling under Competencies (case does not matter) for the link to appear.

---

## P1 - Set up the features added recently

### [ ] 16. Set the site address and the optional settings on Vercel
Vercel > Project > Settings > Environment Variables (Production). Redeploy afterwards.
- `NEXT_PUBLIC_SITE_URL` = your real address, for example `https://karan.dev`. Used for share previews, the sitemap, RSS and search engines. Without it the Vercel address is used.
- `NEXT_PUBLIC_BOOKING_URL` (optional) = your Cal.com or Calendly link. A "Book a call" button appears in the hero only when this is set.
- `GITHUB_TOKEN` (optional) = a GitHub token with no special permissions. Only needed if the "Open source on GitHub" section ever disappears because GitHub rate-limited the public request.
- Email alerts: see item 13.

### [ ] 17. Turn on image uploads (optional)
The blog editor and the project screenshot field have an "Upload image" button. It needs storage:
1. Vercel > Storage > Create > **Blob** > connect it to this project (all environments).
2. Vercel adds `BLOB_READ_WRITE_TOKEN` automatically. For local testing run `vercel env pull .env.local` (back up `.env.local` first).
Until then the button shows "Image uploads are not set up yet". You can always paste an image link instead.

### [ ] 18. Tell search engines and check link previews
1. Google Search Console > add your site > Sitemaps > submit `https://YOUR-DOMAIN/sitemap.xml`.
2. Paste your home page and a blog post into LinkedIn's Post Inspector (linkedin.com/post-inspector) and the X card validator to confirm the preview image and text look right.
3. The RSS feed is at `/feed.xml` and is linked in the footer and blog page.

### [ ] 19. Set up an uptime check (free, 5 minutes)
Create a free monitor at uptimerobot.com (or Better Stack) that requests `https://YOUR-DOMAIN/api/health` every 5 minutes and emails you if it fails. It reports "ok" only when the database also answers.

### [ ] 20. Check the new automatic checks on GitHub
After the first push, open the repository's **Actions** tab: the "CI" workflow should run type-check, lint, tests and build and go green. Dependabot will open weekly update pull requests (Repository > Insights > Dependency graph > Dependabot).

### [ ] 21. Add your real content (nothing is invented)
Sign in and open `/admin`:
- **Case studies:** for each project add the problem, approach, result, a live demo or video link and screenshots.
- **Testimonials:** ask a manager, professor or teammate for a short quote and permission to publish it; add it under "Testimonials and publications". The section stays hidden until at least one exists.
- **Publications:** add your research papers (for example the fake-news detection work) with venue, year and a link.
- **Blog:** `/admin/blog` to write, preview, save drafts and publish. Add tags so readers can filter.
- **Resume:** `/resume` is generated from your site content. Open it and use "Save as PDF" to produce a file you can attach to applications.
- **Availability:** the green "Open to..." badge is in `src/data/portfolio.ts` (`availability`); set `open: false` to hide it.

### [ ] 22. Keep your database migrations in step
Every deploy now runs `npm run db:migrate:ci` first, so new tables and columns are created automatically and safely (it only adds things and imports your original blog posts once). If a deploy fails at that step, check that `DATABASE_URL` is set for that environment.

---

## P2 - Cleanup decisions

### [ ] 7. Unexpected Speckit changes in your working tree
Present since the start of the session, not made by Claude: deleted `.github/skills/*` and `.specify/integrations/copilot.manifest.json`; modified `.specify/init-options.json` and `.specify/integration.json`; new `.specify/integrations/claude.manifest.json`. This looks like Speckit switching from the Copilot integration to Claude.
- If you ran a Speckit setup/upgrade command: keep these and commit them in their own commit.
- If not: `git restore .github .specify` reverts them (check `git status` first so you don't lose anything you want).

### [x] 8. Phone number removed from the site (history still needs a decision)
The phone number was removed from the contact list, footer and tests (2026-09-23), so new deploys no longer show it.
**Still exposed:** the number is in git history (commit `2e53949`, message "add resume content and blog foundation") and that commit is already on `origin/master` of `https://github.com/karankhatri29/Portfolio`, which is a **public** repository. Anyone can still read it in the commit history, and it may be cached by forks, search engines or scrapers. Options, from least to most effort:
1. Accept it: the number is only visible to someone digging through history. Change your number or rely on a spam-filtering app if that worries you.
2. Make the repository private (GitHub > Settings > General > Danger Zone > Change visibility). This hides it from the public but not from anyone who already cloned or forked it. Vercel keeps working.
3. Rewrite history to scrub it (`git filter-repo --replace-text`) and force-push. This is destructive and changes every commit hash; do it deliberately, on a fresh backup clone, and ask Claude to walk you through it. Forks and caches may still hold copies.
Redeploy so the live site stops showing the number, and check `https://YOUR-DOMAIN` for `tel:` links afterward.

### [x] 9. Stale tests (fixed)
Both previously failing tests were fixed. CI now runs the whole suite on every push.

---

## P3 - Later

### [ ] 10. Manual responsive and keyboard review
Lighthouse scores 100 for accessibility, best practices and SEO on every page. What automation cannot judge is feel: open the site on a real phone (375px), a tablet and a laptop, and Tab through the home page, the blog, the resume and the admin forms to check nothing is awkward. Record anything odd in `specs/001-authenticated-portfolio/quickstart.md` or tell Claude.

### [ ] 11. Update the stale spec docs
`plan.md` Phase 4 checkboxes are still unchecked even though the blog is built. Ask Claude to reconcile them.

### [ ] 13. Turn on email alerts (optional, about 10 minutes)
The code is ready. It emails you when someone uses the contact form, and sends a weekly summary every Monday at 03:00 UTC. It stays silent until you do this:
1. Create a free account at resend.com and sign up with the email address where you want the alerts.
2. In Resend go to API Keys > Create API Key (sending access is enough). Copy it.
3. In Vercel > Project > Settings > Environment Variables add, for Production:
   - `RESEND_API_KEY` = the key
   - `NOTIFY_EMAIL` = the same email you signed up to Resend with (the free default sender can only deliver to your own account email)
   - `CRON_SECRET` = any long random string (for example from `openssl rand -base64 32`)
   - `NOTIFY_FROM` is optional; only set it after verifying your own domain in Resend.
4. Redeploy. Send a test message through the contact form and check your inbox (also check spam the first time).
5. The weekly digest is scheduled in `vercel.json` (Mondays 03:00 UTC). To test it right away, in the Vercel dashboard open Settings > Cron Jobs and run `/api/cron/digest`.
6. To disable alerts later, just delete `RESEND_API_KEY`.

### [x] 14. Privacy note (done)
A plain-language `/privacy` page exists and is linked from the footer and the contact form. Re-read it if you change what the site records.

### [ ] 15. Optional: data cleanup schedule
Raw events grow over time. Neon's free tier is generous, but every few months you can delete old rows in the Neon SQL editor: `DELETE FROM events WHERE created_at < now() - interval '180 days';`. Ask Claude if you want this automated.

---

## Done
- [x] Neon database created and linked
- [x] `DATABASE_URL` added to local `.env.local`
- [x] Tables created and seeded (`npm run db:migrate`)
- [x] Phone number removed from all code, pages and the database (git history: see item 8)
- [x] SEO, share previews, sitemap, robots, RSS, privacy page, security headers, custom 404/error pages, health check, error monitoring on the dashboard
- [x] Resume page, case studies, testimonials/publications sections, GitHub section, database-backed blog with admin editor
- [x] CI workflow and Dependabot configuration
- [x] Analytics tables (`events`, `contact_messages`) created in Neon
- [x] `tools`, `stack` and `github_url` columns added and backfilled (`npm run db:migrate`, run 2026-09-23)
