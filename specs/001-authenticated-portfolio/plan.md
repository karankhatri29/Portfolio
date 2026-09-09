# Implementation Plan: Authenticated Portfolio Foundation and Public UI

**Branch**: `001-authenticated-portfolio` | **Date**: 2026-09-09 | **Spec**: [spec.md](spec.md)

## Summary

Build the portfolio as a single Next.js App Router application. Phase 1 establishes the project and test environment. Phase 2 establishes the theme provider, OAuth session boundary, and server-enforced Admin/Visitor RBAC. Phase 3 delivers the public portfolio UI. Phase 4 adds a server-loaded Markdown blog engine. Phase 5 adds SQLite-backed Admin CRUD APIs and Admin-only editing forms. Portfolio content remains data-driven and presentation components remain isolated and testable.

## Technical Context

**Language/Version**: TypeScript 6, React 19, Next.js 16 App Router

**Primary Dependencies**: Tailwind CSS 3, next-themes, next-auth 5, react-markdown, gray-matter, @tailwindcss/typography, better-sqlite3, Jest 30, React Testing Library

**Storage**: Internal Markdown files for blog posts and a local SQLite database for projects and skills, isolated behind server-only repository functions

**Testing**: Jest with jsdom, React Testing Library, user-event, jest-dom; responsive and accessibility checks at mobile, tablet, and desktop widths

**Target Platform**: Modern browsers with a Node.js 20.9+ server runtime

**Project Type**: Single web application

**Performance Goals**: Public shell and first meaningful content visible within 2 seconds on a local production build; theme changes do not navigate

**Constraints**: Mobile-first responsive layout, WCAG 2.1 AA semantics and focus states, server-only OAuth secrets, fail-closed Admin authorization, no hardcoded portfolio content in presentation components, raw Markdown HTML disabled, validated mutations

**Scale/Scope**: One public single-page portfolio, one dynamic project detail route, two OAuth providers, two session roles

## Constitution Check

- **Spec-driven architecture**: PASS. Components and states are documented in [spec.md](spec.md) before implementation.
- **Spec-first TDD**: PASS. Jest/RTL tests were added before the component implementation. Phase 3 must follow Red-Green-Refactor and record each step in separate commits.
- **Component-first responsive UI**: PASS. Phase 3 uses isolated components and CSS responsive constraints without alternate markup trees.
- **Dynamic data separation**: PASS. Hero, timeline, competencies, projects, and contact links consume portfolio data modules.
- **Secure RBAC**: PASS. Role resolution and admin route protection occur on the server boundary; client UI is not the authorization source.
- **Dynamic Markdown content**: PASS. Blog posts are loaded from internal Markdown files on the server.
- **Protected CRUD**: PASS. API handlers independently verify Admin sessions and validate payloads before persistence.

## Applied Guidelines

- Use Next.js App Router route segments for dynamic project pages.
- Use `next/link` for internal navigation and framework not-found handling for missing slugs.
- Keep client components limited to interactive theme/auth controls; render static portfolio sections as server components where possible.
- Use semantic landmarks, ordered lists for chronology, descriptive link names, and visible keyboard focus states.
- Prefer CSS grid/flex responsive constraints over JavaScript viewport branching.
- Keep Markdown loading and SQLite access server-only; do not import either boundary into client components.
- Keep route handlers thin by delegating validation and persistence to `src/lib/content` modules.
- Treat Admin UI conditions as presentation only; every mutation endpoint independently checks `session.role`.

## Implementation Steps

### Phase 1: Project and Test Foundation [complete]

**Plan 1.1**: Initialize Next.js App Router, TypeScript, Tailwind design tokens, Jest, and RTL configuration. [FR-001, FR-003, FR-011]

**Plan 1.2**: Establish package scripts and a passing browser-like test smoke check. [FR-011]

### Phase 2: Theme, OAuth, and RBAC Foundation [complete]

**Plan 2.1**: Implement next-themes providers and accessible theme toggle with dark default and light persistence. [FR-003, FR-004, FR-010]

**Plan 2.2**: Configure NextAuth Google/GitHub providers, typed role-bearing sessions, and the auth route. [FR-005, FR-006, FR-007, FR-012]

**Plan 2.3**: Implement exact owner role resolution, AdminGate, and server middleware for admin pages and admin API routes. [FR-008, FR-009]

**Plan 2.4**: Implement the data-backed portfolio shell and public App Router entry page. [FR-001, FR-002, FR-010]

### Phase 3: Public UI Development [planned]

**Plan 3.1**: Expand the portfolio data contract and add fixture-driven tests for hero, timeline, competencies, projects, and contact links. [FR-001, FR-002, FR-010; US4]

**Plan 3.2**: Build the responsive single-page public layout with HeroSection, CareerTimeline, and CompetencyGrid. [FR-001, FR-002, FR-010; US4]

**Plan 3.3**: Build ProjectCard and dynamic `/projects/[slug]` detail pages using stable slugs and `notFound()` for missing projects. [FR-001, FR-002, FR-010; US4]

**Plan 3.4**: Build ContactFooter with local embedded SVG icons, accessible names, focus states, and data-driven contact links. [FR-001, FR-002, FR-010; US4]

**Plan 3.5**: Validate responsive behavior at 375px, 768px, and 1440px widths and run accessibility checks for landmarks, heading order, keyboard navigation, and link names. [FR-001, FR-010; US4]

### Phase 4: Markdown Blog Engine [planned]

**Plan 4.1**: Install Markdown/front matter/typography dependencies and add server-only Markdown fixtures and loader. [FR-013, FR-015]

**Plan 4.2**: Implement `/blog` and `/blog/[slug]` routes with metadata, safe Markdown rendering, prose dark/light classes, and not-found behavior. [FR-013, FR-014, FR-015]

**Plan 4.3**: Add Jest/RTL tests for Markdown parsing, index data, route lookup, and malformed/missing posts. [FR-013, FR-014, FR-021]

### Phase 5: Admin CRUD APIs and Editing UI [planned]

**Plan 5.1**: Add SQLite schema/seed access, project/skill validation, and server-only repository functions. [FR-016, FR-018, FR-020]

**Plan 5.2**: Implement `/api/projects` and `/api/skills` GET/POST/PATCH/DELETE handlers with Admin-only mutation authorization. [FR-016, FR-017, FR-018, FR-020]

**Plan 5.3**: Implement the Admin editor route and client form for project/skill CRUD with conditional rendering and operation states. [FR-019]

**Plan 5.4**: Add API authorization/validation tests and Admin form visibility/submission tests. [FR-017, FR-018, FR-019, FR-021]

### Phase 6: Polish and Cross-Cutting Validation [planned]

**Plan 6.1**: Complete manual responsive/accessibility review and document evidence for 375px, 768px, and 1440px viewports. [FR-010, FR-011]

**Plan 6.2**: Run Jest, ESLint, and `next build`; review data boundaries and environment documentation. [FR-011, FR-012, FR-020, FR-021]

## Project Structure

```text
webapp/
├── .github/skills/                 # Speckit workflow skills
├── .specify/                       # Speckit configuration and constitution
├── specs/001-authenticated-portfolio/
│   ├── spec.md
│   ├── plan.md
│   ├── checklists/requirements.md
│   └── checkpoints/
├── __tests__/                      # Jest environment tests
├── src/
│   ├── app/
│   │   ├── api/auth/[...nextauth]/route.ts
│   │   ├── api/projects/route.ts
│   │   ├── api/skills/route.ts
│   │   ├── admin/page.tsx
│   │   ├── blog/[slug]/page.tsx
│   │   ├── blog/page.tsx
│   │   ├── projects/[slug]/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── AuthControls.tsx
│   │   ├── AdminGate.tsx
│   │   ├── CareerTimeline.tsx
│   │   ├── CompetencyGrid.tsx
│   │   ├── ContactFooter.tsx
│   │   ├── HeroSection.tsx
│   │   ├── PortfolioShell.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── Providers.tsx
│   │   ├── RoleBadge.tsx
│   │   └── ThemeToggle.tsx
│   ├── data/portfolio.ts
│   ├── content/blog/*.md
│   ├── lib/content/blog.ts
│   ├── lib/content/repository.ts
│   ├── lib/content/schemas.ts
│   ├── lib/auth/roles.ts
│   ├── auth.ts
│   └── admin/ContentEditor.tsx
├── data/portfolio.sqlite
├── types/next-auth.d.ts
├── middleware.ts
├── jest.config.ts
├── jest.setup.ts
├── tailwind.config.ts
└── package.json
```

**Structure Decision**: Keep the single web application structure already established by Phase 1 and Phase 2. Static public sections are reusable components under `src/components`; route-specific composition lives under `src/app`; all content fixtures live under `src/data`.

## Task Breakdown

### Phase 1: Setup

- [x] T001 [Plan:1.1] Initialize the TypeScript Next.js App Router package and scripts in `package.json`.
- [x] T002 [P] [Plan:1.1] Configure TypeScript and Next environment files in `tsconfig.json` and `next-env.d.ts`.
- [x] T003 [P] [Plan:1.1] Configure Tailwind tokens and PostCSS in `tailwind.config.ts`, `postcss.config.mjs`, and `src/app/globals.css`.
- [x] T004 [P] [Plan:1.2] Configure Jest and RTL in `jest.config.ts` and `jest.setup.ts`.
- [x] T005 [Plan:1.2] Add the Jest/RTL environment smoke test in `__tests__/test-environment.test.ts`.

### Phase 2: Foundational

- [x] T006 [P] [Plan:2.1] Configure the dark-default theme provider in `src/components/Providers.tsx`.
- [x] T007 [P] [Plan:2.1] Implement the accessible theme toggle in `src/components/ThemeToggle.tsx` with tests in `src/components/ThemeToggle.test.tsx`.
- [x] T008 [P] [Plan:2.2] Configure Google and GitHub OAuth callbacks and role-bearing sessions in `src/auth.ts` and `types/next-auth.d.ts`.
- [x] T009 [P] [Plan:2.2] Expose the NextAuth App Router handler in `src/app/api/auth/[...nextauth]/route.ts`.
- [x] T010 [P] [Plan:2.3] Implement fail-closed role resolution in `src/lib/auth/roles.ts` with tests in `src/lib/auth/roles.test.ts`.
- [x] T011 [P] [Plan:2.3] Implement `AdminGate` with tests in `src/components/AdminGate.tsx` and `src/components/AdminGate.test.tsx`.
- [x] T012 [Plan:2.3] Protect admin pages and API routes in `middleware.ts`.
- [x] T013 [Plan:2.4] Implement the data-backed shell and public root route in `src/components/PortfolioShell.tsx`, `src/data/portfolio.ts`, `src/app/layout.tsx`, and `src/app/page.tsx`.
- [x] T014 [Plan:2.4] Implement signed-out and signed-in auth controls in `src/components/AuthControls.tsx` with tests in `src/components/AuthControls.test.tsx`.

### Phase 3: Public UI Development

- [x] T015 [Plan:3.1] Extend `src/data/portfolio.ts` with typed hero, timeline, competency, project, and contact-link fixtures; add tests for the data contract in `src/data/portfolio.test.ts`.
- [x] T016 [P] [Plan:3.1] Write failing HeroSection and timeline tests in `src/components/HeroSection.test.tsx` and `src/components/CareerTimeline.test.tsx` from User Story 4 acceptance scenarios.
- [x] T017 [P] [Plan:3.1] Write failing competency and project-card tests in `src/components/CompetencyGrid.test.tsx` and `src/components/ProjectCard.test.tsx`.
- [x] T018 [P] [Plan:3.1] Write failing contact-footer accessibility tests in `src/components/ContactFooter.test.tsx`.
- [x] T019 [Plan:3.2] Implement `HeroSection` in `src/components/HeroSection.tsx` against the red tests.
- [x] T020 [P] [Plan:3.2] Implement chronological `CareerTimeline` in `src/components/CareerTimeline.tsx` against the red tests.
- [x] T021 [P] [Plan:3.2] Implement responsive `CompetencyGrid` in `src/components/CompetencyGrid.tsx` against the red tests.
- [x] T022 [Plan:3.2] Compose the Phase 3 sections into `src/app/page.tsx` without duplicating portfolio content in JSX.
- [x] T023 [Plan:3.3] Write failing dynamic-route tests for valid and missing project slugs in `src/app/projects/[slug]/page.test.tsx`.
- [x] T024 [Plan:3.3] Implement `ProjectCard` in `src/components/ProjectCard.tsx` with an accessible link to `/projects/[slug]`.
- [x] T025 [Plan:3.3] Implement `src/app/projects/[slug]/page.tsx` with data lookup, detail rendering, and `notFound()` fallback.
- [x] T026 [Plan:3.4] Implement local SVG icon components and data-driven `ContactFooter` in `src/components/ContactFooter.tsx`.
- [x] T027 [Plan:3.4] Add the contact footer to `src/components/PortfolioShell.tsx` or the root composition without nesting page cards inside cards.
- [x] T028 [Plan:3.5] Add responsive and accessibility validation notes to `specs/001-authenticated-portfolio/quickstart.md` covering 375px, 768px, and 1440px viewports.
- [x] T029 [Plan:3.5] Run keyboard, landmark, heading-order, and accessible-name checks for Phase 3 components and record evidence in `specs/001-authenticated-portfolio/quickstart.md`.

### Phase 4: Polish and TDD Evidence

- [x] T030 [Plan:4.1] Run Jest, ESLint, and `next build`; fix only Phase 3 findings in the affected files.
- [x] T031 [Plan:4.2] Review the requirement mapping and verify all public content is sourced from `src/data/portfolio.ts`.
- [ ] T032 [Plan:3.1,3.2,3.3,3.4] Create a Red commit after Phase 3 tests fail, a Green commit after implementations pass, and a Refactor commit after accessibility/responsive cleanup. Do not squash these commits.

### Phase 4: Markdown Blog Engine

- [ ] T033 [Plan:4.1] Install `react-markdown`, `gray-matter`, and `@tailwindcss/typography`; update `package.json`, `package-lock.json`, and `tailwind.config.ts`.
- [ ] T034 [P] [Plan:4.1] Add Markdown fixtures under `src/content/blog/` with front matter for title, date, and summary.
- [ ] T035 [Plan:4.1] Write failing Markdown loader tests in `src/lib/content/blog.test.ts` for metadata, body, missing slugs, and malformed front matter.
- [ ] T036 [Plan:4.1] Implement the server-only Markdown loader in `src/lib/content/blog.ts` with safe path handling and raw HTML disabled.
- [ ] T037 [P] [Plan:4.2] Write failing blog index and detail-route tests in `src/app/blog/page.test.tsx` and `src/app/blog/[slug]/page.test.tsx`.
- [ ] T038 [Plan:4.2] Implement `/blog` and `/blog/[slug]` routes with `notFound()` handling and responsive dark/light `prose` styling.

### Phase 5: Admin CRUD APIs and Editing UI

- [ ] T039 [Plan:5.1] Install `better-sqlite3` and its types; configure Next server externalization and add `data/portfolio.sqlite` to `.gitignore`.
- [ ] T040 [P] [Plan:5.1] Write failing validation tests for project and skill payloads in `src/lib/content/schemas.test.ts`.
- [ ] T041 [Plan:5.1] Implement SQLite initialization, schema creation, seed data, and repository functions in `src/lib/content/repository.ts`.
- [ ] T042 [Plan:5.1] Implement project and skill payload validation in `src/lib/content/schemas.ts`.
- [ ] T043 [P] [Plan:5.2] Write failing API authorization and CRUD tests for `src/app/api/projects/route.test.ts` and `src/app/api/skills/route.test.ts`.
- [ ] T044 [Plan:5.2] Implement `/api/projects` GET/POST/PATCH/DELETE handlers with server-session role checks and structured errors.
- [ ] T045 [Plan:5.2] Implement `/api/skills` GET/POST/PATCH/DELETE handlers with server-session role checks and structured errors.
- [ ] T046 [Plan:5.3] Write failing Admin editor visibility and operation-state tests in `src/components/ContentEditor.test.tsx`.
- [ ] T047 [Plan:5.3] Implement Admin-only editor controls in `src/components/ContentEditor.tsx` for project and skill CRUD.
- [ ] T048 [Plan:5.3] Implement the protected Admin route in `src/app/admin/page.tsx` and connect it to `ContentEditor`.

### Phase 6: Final Validation

- [ ] T049 [Plan:6.1] Complete responsive and keyboard accessibility review and record evidence in `specs/001-authenticated-portfolio/quickstart.md`.
- [ ] T050 [Plan:6.2] Run the complete Jest, lint, and production build gates; fix only relevant Phase 4/5 findings.
- [ ] T051 [Plan:6.2] Review all new route boundaries, secret usage, Markdown paths, and Admin mutation authorization before release.

## TDD Commit Checkpoints

Phase 3 must make the Red-Green-Refactor cycle visible in git history:

1. **Red**: commit only the Phase 3 tests and fixtures; the new tests must fail because the components/routes are not implemented.
2. **Green**: implement the smallest behavior that makes the Phase 3 tests pass; record the passing test command in the commit message.
3. **Refactor**: improve responsive styles, semantics, and duplication only while keeping the suite green; record the build/lint/accessibility evidence.

The agent must not create these commits without an explicit commit request. The task is ready for the user or a later implementation pass to execute these checkpoints deliberately.

## Dependencies and Execution Order

- Phase 1 is complete and unblocks Phase 2.
- Phase 2 is complete and unblocks Phase 3.
- T015 must precede T016-T018 because tests need the typed fixture contract.
- T016-T018 are parallelizable and must remain red before T019-T021/T024/T026.
- T019-T022 deliver the single-page public UI.
- T023 must be red before T025; T024 and T025 form the project-card/detail-route slice.
- T028-T029 follow the complete Phase 3 UI and precede the Refactor commit.
- Phase 4 follows all Phase 3 tasks.
- Phase 5 follows the blog/content boundary setup and may proceed after the shared content model is established.
- Phase 6 follows Phases 4 and 5.

## Requirement Mapping

| Requirement | Plan Items | Implementation Evidence |
|---|---|---|
| FR-001 | 1.1, 2.4, 3.2, 3.3, 3.4 | `src/app/page.tsx`, public section components, project route, footer |
| FR-002 | 2.4, 3.1, 3.2, 3.3, 3.4 | Component contracts in `spec.md`, isolated `src/components/*.tsx`, `src/data/portfolio.ts` |
| FR-003 | 1.1, 2.1 | `tailwind.config.ts`, `src/components/Providers.tsx`, `src/components/ThemeToggle.tsx` |
| FR-004 | 2.1 | `next-themes` provider and theme toggle behavior test |
| FR-005 | 2.2 | `src/auth.ts`, NextAuth route handler |
| FR-006 | 2.2 | `types/next-auth.d.ts`, `src/auth.ts` session callback |
| FR-007 | 2.3 | `src/lib/auth/types.ts`, role-bearing session callback |
| FR-008 | 2.3 | `src/lib/auth/roles.ts`, role-resolution tests |
| FR-009 | 2.3 | `middleware.ts`, `AdminGate.tsx`, protected route tests |
| FR-010 | 2.1, 2.4, 3.2, 3.3, 3.4, 3.5 | Accessible controls, denied states, semantic sections, route fallback, accessibility evidence |
| FR-011 | 1.2, 2.1, 2.3, 3.1, 3.5, 4.1 | Jest/RTL suites and final validation commands |
| FR-012 | 2.2, 2.3, 4.2 | Server-only environment reads, middleware enforcement, data separation review |
| US4 | 3.1, 3.2, 3.3, 3.4, 3.5 | Hero, timeline, competency grid, project detail route, contact footer, responsive/accessibility evidence |
| FR-013 | 4.1, 4.2 | `src/lib/content/blog.ts`, Markdown fixtures, blog routes |
| FR-014 | 4.2 | `src/app/blog/page.tsx`, `src/app/blog/[slug]/page.tsx` |
| FR-015 | 4.2 | Typography plugin and themed `prose` classes |
| FR-016 | 5.1, 5.2 | SQLite repository, `/api/projects`, `/api/skills` |
| FR-017 | 2.3, 5.2, 5.3 | `middleware.ts`, route role checks, Admin editor |
| FR-018 | 5.1, 5.2 | Schemas and structured API validation errors |
| FR-019 | 5.3 | `ContentEditor.tsx`, Admin route, operation-state tests |
| FR-020 | 5.1, 5.2 | Server-only repository boundary and API handlers |
| FR-021 | 4.3, 5.4, 6.2 | Blog, API, Admin UI, and final validation tests |
