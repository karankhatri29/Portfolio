### DevPortfolio Constitution

#### Core Principles & Non-Negotiables

##### I. Spec-Driven Architecture (Non-Negotiable)

Every feature, component, and state transition begins as a documented specification using Speckit. No code is written until the component's UI, props, and data requirements are defined and approved in the spec.

##### II. Spec-First Workflow (Non-Negotiable)

Spec-Driven Development (TDD) is strictly enforced. The workflow mandates writing the spec, followed by tests using Jest and React Testing Library, before implementing the React component. The Red-Green-Refactor cycle must be clearly visible in the project's commit history.

##### III. Component-First & Responsive by Default (Non-Negotiable)

The frontend is built using modular, isolated, and reusable React components. Mobile-first design is strictly mandatory. Every component must adapt seamlessly across mobile, tablet, and desktop viewports without requiring structural HTML changes.

##### IV. Dynamic Data Separation (Non-Negotiable)

Content is strictly separated from presentation. Portfolio data, including projects and skills, must be consumed dynamically rather than hardcoded into React components. Blog and research content must be dynamically parsed and rendered from internal Markdown files.

##### V. Secure Role-Based Access (Non-Negotiable)

An authentication wrapper must be implemented to require OAuth 2.0 login (e.g., Google or GitHub) for secure session management. Authorization middleware must enforce Role-Based Access Control (RBAC), identifying the owner as the 'Admin' with exclusive rights to gated editing features, while standard authenticated users are assigned read-only 'Visitor' roles.

#### Technology Stack & Constraints

* **Core Framework:** Next.js utilizing the App Router to handle all frontend layouts and server-side logic.


* **Backend & API:** Custom Next.js API routes will act as the backend service handling Admin CRUD operations for dynamic data.


* **Styling & Theme:** Tailwind CSS must be used to enforce consistent design tokens. The `next-themes` library must be configured to default to a high-contrast dark mode while providing a user-triggered light mode toggle.


* **Markdown Engine:** A Markdown parser (e.g., `react-markdown`) styled via `@tailwindcss/typography` must be used to render internal blog posts cleanly in both dark and light modes.


* **Testing:** Jest and React Testing Library for standard UI rendering and restricted Admin access routes.



#### Development Workflow

1. **Spec Phase:** Define the component's visual structure, state, and mock data in Speckit prior to coding.


2. **Test Phase:** Write unit tests based directly on the acceptance criteria in the spec.


3. **Implementation Phase:** Build the React component to satisfy the failing tests.


4. **Validation Phase:** Verify responsive behavior across at least three viewport sizes and perform accessibility checks to ensure WCAG 2.1 AA compliance.


5. **Review Phase:** All pull requests must include the spec file, passing tests, and the implemented component.



#### Governance

This Constitution supersedes all other development practices for this project. Any structural changes to the React architecture, data fetching strategy, styling framework, or authentication mechanisms require a formal amendment to this document. All code reviews must explicitly verify compliance with these core principles.

**Version**: 1.0.0 | **Ratified**: 2026-09-03 | **Last Amended**: 2026-09-03