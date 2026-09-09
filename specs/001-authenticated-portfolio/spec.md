# Feature Specification: Authenticated Portfolio Foundation

**Feature Branch**: `001-authenticated-portfolio`

**Created**: 2026-09-09

**Status**: Ready for implementation

**Input**: User description: Define component specifications in Speckit and set up the testing environment using Jest and React Testing Library before writing any code. Initialize the Next.js project using the App Router, configuring Tailwind CSS for design tokens and next-themes for dark/light mode toggling. Integrate NextAuth.js for OAuth 2.0 logins (Google, GitHub) and establish Role-Based Access Control (RBAC) to separate Admin and Visitor sessions.

## User Scenarios & Testing

### User Story 1 - Browse the portfolio in a stable theme (Priority: P1)

A visitor can open the portfolio, understand who owns it, and switch between the default dark theme and a light theme without losing the current page.

**Why this priority**: The public portfolio is the primary value and must remain usable before authentication is introduced.

**Independent Test**: Render the shell and theme toggle in isolation, verify the default dark theme, activate the toggle, and verify the light theme state and accessible label.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor opens the root page, **When** the page renders, **Then** the portfolio shell, navigation, and primary content are visible and the dark theme is active by default.
2. **Given** the portfolio shell is visible, **When** the visitor activates the theme toggle, **Then** the light theme becomes active without a full page navigation.
3. **Given** the visitor reloads after choosing a theme, **When** the shell renders again, **Then** the selected theme is restored.

### User Story 2 - Authenticate with an OAuth provider (Priority: P1)

A visitor can sign in using Google or GitHub and see a signed-in session state with their identity and role.

**Why this priority**: OAuth login is the required trust boundary for protected portfolio actions.

**Independent Test**: Render the authentication controls with mocked session and sign-in callbacks, verify provider choices, and verify the signed-in and signed-out states.

**Acceptance Scenarios**:

1. **Given** no active session exists, **When** the visitor opens the sign-in control, **Then** Google and GitHub sign-in actions are available.
2. **Given** the visitor selects Google or GitHub, **When** authentication succeeds, **Then** the session exposes the user's display identity and role.
3. **Given** an OAuth provider returns an error or is unavailable, **When** authentication completes, **Then** the visitor remains signed out and receives an accessible error state.

### User Story 3 - Enforce Admin and Visitor access (Priority: P1)

The portfolio owner can access admin-only editing actions, while any other authenticated account is treated as a read-only Visitor.

**Why this priority**: Authorization must be enforced independently of the UI so protected mutations cannot be reached by changing client state.

**Independent Test**: Exercise the role resolver and protected route behavior with Admin, Visitor, unauthenticated, and unknown-user inputs.

**Acceptance Scenarios**:

1. **Given** an authenticated account matches the configured owner identity, **When** the account requests an admin route or mutation, **Then** the request is allowed and the session role is Admin.
2. **Given** an authenticated account does not match the configured owner identity, **When** the account requests an admin route or mutation, **Then** the request is denied and the session role is Visitor.
3. **Given** no session exists, **When** the account requests an admin route or mutation, **Then** the request is denied and the account is directed to sign in.
4. **Given** an OAuth profile has no recognized email, **When** the session is created, **Then** the account receives the Visitor role and never receives admin permissions.

### User Story 4 - Explore work and contact the owner (Priority: P2)

A visitor can scan the owner's story, competencies, and projects on one responsive page, open a project detail route, and find a contact footer with recognizable external links.

**Why this priority**: The public portfolio must communicate capability and provide a clear next action after the authentication foundation is stable.

**Independent Test**: Render the public page with fixture portfolio data, verify the hero, chronological timeline, competency grid, project links, detail route data, and accessible footer icon links at narrow and wide viewport widths.

**Acceptance Scenarios**:

1. **Given** a visitor opens the public page, **When** the page renders, **Then** the hero, chronological timeline, and competency grid appear in a readable responsive layout.
2. **Given** portfolio project data contains a slug, **When** the visitor selects its project card, **Then** the visitor reaches a detail page for that slug with the matching project content.
3. **Given** the visitor reaches the end of the page, **When** the contact footer renders, **Then** email and external profile links have accessible names and embedded SVG icons that do not rely on color alone.

### User Story 5 - Read research notes as blog posts (Priority: P2)

A visitor can browse internal Markdown research notes and open a stable blog route that renders the post title, metadata, and formatted content.

**Why this priority**: Research content demonstrates depth while keeping writing separate from presentation code.

**Independent Test**: Render a Markdown fixture through the blog loader and verify the index and `/blog/[slug]` route expose the expected heading, metadata, formatted paragraphs, links, and missing-post behavior.

**Acceptance Scenarios**:

1. **Given** a valid internal Markdown file exists, **When** a visitor opens its blog slug, **Then** the title, metadata, and Markdown content render with readable light and dark theme styles.
2. **Given** multiple Markdown files exist, **When** a visitor opens the blog index, **Then** posts are listed from parsed metadata rather than hardcoded JSX.
3. **Given** a blog slug does not map to an internal Markdown file, **When** the visitor opens that route, **Then** the application returns its standard not-found state.

### User Story 6 - Manage portfolio content as Admin (Priority: P1)

The portfolio owner can create, read, update, and delete project and competency records through protected Admin controls, while Visitors and unauthenticated users cannot mutate content.

**Why this priority**: The portfolio needs a secure editing workflow without making public content depend on client-side authorization.

**Independent Test**: Exercise the project and skill API handlers with Admin, Visitor, and unauthenticated sessions, then render the Admin form for each session state and verify only Admin users receive mutation controls.

**Acceptance Scenarios**:

1. **Given** an Admin session opens the protected editor, **When** the editor renders, **Then** project and competency forms plus create, update, and delete actions are available.
2. **Given** an Admin submits valid project or competency data, **When** the corresponding API route receives the request, **Then** the record is persisted and the response contains the updated record.
3. **Given** a Visitor or unauthenticated user submits a mutation request, **When** the API route receives the request, **Then** it returns an authorization error and does not change data.
4. **Given** an Admin submits invalid or incomplete data, **When** the API route validates the request, **Then** it returns a clear validation error and preserves the existing record.

### Edge Cases

- Missing OAuth environment variables must fail with a clear configuration error at authentication time, without exposing secrets.
- A user who changes theme while signed out or signed in must retain the selected theme across navigation.
- Admin authorization must fail closed when the configured owner identity is missing or does not match exactly.
- Role changes must be reflected on a newly issued session and must not rely only on client-side state.
- Sign-in and sign-out controls must remain keyboard accessible and expose meaningful names to assistive technology.
- Markdown files with malformed front matter or unreadable content must produce a controlled error rather than an unhandled server failure.
- API mutations must validate required fields, reject unknown operations, and avoid partial writes.
- Admin forms must show pending, success, validation-error, and server-error states without exposing secrets or internal stack traces.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST provide an App Router portfolio shell with navigation, primary content, and a persistent theme toggle.
- **FR-002**: The system MUST define reusable components with documented props and data requirements before implementation.
- **FR-003**: The system MUST use a dark theme as the default and allow users to switch to a light theme.
- **FR-004**: The system MUST preserve the selected theme across page navigation and reloads.
- **FR-005**: The system MUST provide OAuth 2.0 sign-in actions for Google and GitHub.
- **FR-006**: The system MUST expose a signed-in session containing the user's stable identity, display name, image when available, and role.
- **FR-007**: The system MUST assign exactly one role, either Admin or Visitor, to every session.
- **FR-008**: The system MUST assign Admin only when the authenticated identity exactly matches the configured owner identity; all other authenticated accounts MUST be Visitors.
- **FR-009**: The system MUST protect admin pages and mutation endpoints on the server side and deny unauthenticated or Visitor requests.
- **FR-010**: The system MUST provide accessible loading, error, signed-out, signed-in, and denied states for authentication controls and protected routes.
- **FR-011**: The project MUST include Jest and React Testing Library configuration and tests for theme behavior, authentication states, role resolution, and protected access before component implementation is considered complete.
- **FR-012**: The project MUST keep OAuth secrets and owner configuration in environment variables and MUST NOT expose them to client components.
- **FR-013**: The system MUST load internal blog posts from Markdown files and render their front matter, headings, paragraphs, links, and lists through a safe Markdown parser.
- **FR-014**: The system MUST provide a blog index and dynamic `/blog/[slug]` route with a not-found state for unknown slugs.
- **FR-015**: The system MUST style rendered Markdown consistently in both dark and light themes.
- **FR-016**: The system MUST expose `/api/projects` and `/api/skills` handlers for authenticated CRUD operations.
- **FR-017**: The system MUST allow only Admin sessions to create, update, or delete projects and competencies; Visitor and unauthenticated mutation requests MUST be rejected.
- **FR-018**: The system MUST validate project and competency payloads before persistence and return structured client-safe errors.
- **FR-019**: The system MUST provide Admin-only UI forms that connect to the CRUD routes and expose pending, success, validation-error, and server-error states.
- **FR-020**: The system MUST keep content persistence behind a server-side data access boundary so client components cannot bypass authorization.
- **FR-021**: The project MUST include Jest/RTL tests for Markdown loading, blog routes, CRUD authorization, validation, and Admin form visibility before implementation is complete.

### Component Specifications

#### `PortfolioShell`

- **Purpose**: Own the responsive page frame, navigation, main content region, and auth/theme controls.
- **Props**: `children: React.ReactNode`; `session?: Session | null`.
- **Data**: Reads the current session through the server boundary and receives portfolio content from data modules rather than embedding content in layout markup.
- **States**: loading shell, signed out, signed in as Visitor, signed in as Admin, dark theme, light theme.
- **Accessibility**: landmark regions, one page-level heading, skip link, keyboard navigable controls.

#### `ThemeToggle`

- **Purpose**: Toggle the active color theme.
- **Props**: `className?: string`.
- **Data**: Reads and updates the theme through the theme provider.
- **States**: dark active, light active, mounted/unmounted hydration-safe state.
- **Accessibility**: icon button with an accessible name that describes the action and `aria-pressed` state.

#### `AuthControls`

- **Purpose**: Present OAuth actions or current-session identity and sign-out action.
- **Props**: `session: Session | null`; `onSignIn?: (provider: "google" | "github") => void`; `onSignOut?: () => void`.
- **Data**: Session identity and role; provider availability; auth status.
- **States**: signed out, signing in, signed in, signing out, auth error.
- **Accessibility**: provider buttons have visible labels and live-region feedback for errors/loading.

#### `RoleBadge`

- **Purpose**: Communicate the current authorization role.
- **Props**: `role: "Admin" | "Visitor"`.
- **Data**: Role from the server-issued session.
- **States**: Admin and Visitor.
- **Accessibility**: role is conveyed as text, not color alone.

#### `AdminGate`

- **Purpose**: Protect admin UI and provide a denied state for non-admin sessions.
- **Props**: `children: React.ReactNode`; `session: Session | null`.
- **Data**: Server-issued session role.
- **States**: unauthenticated, Visitor denied, Admin allowed.
- **Accessibility**: denied state explains the next action; protected content is not rendered for denied users.

#### `HeroSection`

- **Purpose**: Introduce the portfolio owner with a concise value statement and primary navigation context.
- **Props**: `content: PortfolioContent`.
- **Data**: Reads title, summary, and eyebrow from the portfolio data module.
- **States**: populated and content fallback.
- **Accessibility**: one descriptive `h1`, visible focus styles, and no text baked into imagery.

#### `CareerTimeline`

- **Purpose**: Present milestones in chronological order.
- **Props**: `items: TimelineItem[]`.
- **Data**: Timeline entries come from portfolio data and include date, title, organization, and summary.
- **States**: populated and empty-state message.
- **Accessibility**: ordered semantic list with dates readable by assistive technology.

#### `CompetencyGrid`

- **Purpose**: Present core competencies as a scannable responsive grid.
- **Props**: `items: Competency[]`.
- **Data**: Competencies come from portfolio data and include label and supporting description.
- **States**: populated and empty-state message.
- **Accessibility**: consistent heading hierarchy and readable content at mobile, tablet, and desktop widths.

#### `ProjectCard` and `ProjectDetailPage`

- **Purpose**: Summarize work on the index page and expose the full project story at a stable slug route.
- **Props**: `project: Project`; detail page receives `slug: string` from the route params.
- **Data**: Projects come from portfolio data and include slug, title, year, summary, role, and outcomes.
- **States**: populated card, missing project route, and project detail.
- **Accessibility**: card has one clear link target with descriptive text; missing routes use the framework not-found state.

#### `ContactFooter`

- **Purpose**: Give visitors clear contact and profile actions at the end of the page.
- **Props**: `links: ContactLink[]`.
- **Data**: Contact links come from portfolio data; SVG icons are local component markup.
- **States**: configured links and missing-link fallback.
- **Accessibility**: every icon link has an accessible name and visible focus treatment.

### Key Entities

- **Session**: Authenticated identity with provider account details and exactly one `Admin` or `Visitor` role.
- **Role**: Authorization classification controlling access to admin pages and mutations.
- **ThemePreference**: User-selected `dark` or `light` visual mode persisted across reloads.
- **OwnerIdentity**: Server-only configured identity used for exact Admin assignment.
- **PortfolioContent**: Public, presentation-independent content containing hero copy, timeline items, competencies, projects, and contact links.
- **Project**: A portfolio work item identified by a stable slug and rendered in both card and detail views.
- **BlogPost**: Internal Markdown content with a stable slug, title, publication date, summary, and rendered body.
- **SkillRecord**: A competency record with a stable identifier, name, and description that can be managed by Admin users.
- **ContentMutation**: A validated create, update, or delete operation against a project or skill record.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A fresh visitor can see the primary portfolio shell and its first meaningful content within 2 seconds on a local production build.
- **SC-002**: Theme switching completes in one user action and does not trigger a full page navigation.
- **SC-003**: 100% of automated authorization cases deny unauthenticated and Visitor access to admin resources.
- **SC-004**: 100% of automated authentication-control cases expose accessible names and cover signed-out, signed-in, loading, and error states.
- **SC-005**: A reviewer can identify each component's props, data source, and state from this specification before implementation begins.

## Assumptions

- Google and GitHub OAuth applications and callback URLs will be configured outside the repository.
- The owner identity is represented by a server-only environment variable containing the exact owner email.
- Visitor accounts may authenticate and browse public content but cannot edit portfolio data.
- Portfolio content will be added through data modules or Markdown in later features; this foundation only establishes the shell and access boundary.
- The application will use a single Next.js web app with TypeScript and the App Router.
- Jest and React Testing Library are the required unit/component test tools; browser-level responsive checks are a later validation step.
