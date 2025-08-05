# Epic 2: UI Toolkit & Development Operations

**Goal:** To integrate the full UI toolkit (ShadCN, Tailwind) and Storybook while establishing development operations visibility. This epic focuses on building out the component showcase page with a functional light/dark mode theme toggle, creating a living library for all future UI development, and implementing automated version tracking for deployment visibility.

---

## Story 2.1: Integrate ShadCN/UI Library

_As a developer, I want the ShadCN/UI library fully integrated into the Next.js application, so that I have a set of accessible, themeable components to build with._

**Acceptance Criteria:**

1.  The ShadCN/UI CLI is used to initialize the library in the `apps/web` project.
2.  Core dependencies like Tailwind CSS and Radix UI are correctly configured.
3.  A handful of basic components (e.g., `Button`, `Card`, `Input`) are added to the `packages/ui` directory.
4.  The components can be successfully imported and rendered on the homepage.

---

## Story 2.2: Set Up Storybook Environment

_As a developer, I want a Storybook environment set up for our shared UI package, so that I can develop, test, and document components in isolation._

**Acceptance Criteria:**

1.  Storybook is initialized in a new `packages/storybook` directory.
2.  It is configured to find and display components from the `packages/ui` directory.
3.  A sample story is created for the `Button` component.
4.  The Storybook instance can be run locally using a dedicated script (e.g., `bun run storybook`).

---

## Story 2.3: Build the Component Showcase Page

_As a user, I want to view a page that showcases all available UI components, so that I can understand the visual language and capabilities of the starter template._

**Acceptance Criteria:**

1.  A new page is created at `/showcase` in the Next.js application.
2.  This page imports and displays an instance of every component from the `packages/ui` library.
3.  The page is linked in the main navigation.
4.  The page layout is clean, responsive, and easy to navigate.

---

## Story 2.4: Implement Theme & Dark Mode Toggler

_As a user, I want to be able to switch between light and dark modes, so that I can use the application comfortably in different lighting conditions._

**Acceptance Criteria:**

1.  A theme provider is configured at the root of the Next.js application.
2.  A UI control (e.g., a button with a sun/moon icon) is added to the main layout.
3.  Clicking the control instantly toggles the application's color scheme between light and dark mode.
4.  The user's theme preference is persisted across sessions (e.g., using local storage).
5.  All components on the `/showcase` page render correctly in both light and dark modes.

---

## Story 2.5: Automated Version Display & History System

_As a website owner (david@ideasmen.com.au), I want an automated version tracking and display system that shows the current website version with historical navigation capabilities, so that I can track deployment history, understand what changes were made, and easily navigate between different versions of the website._

**Acceptance Criteria:**

1.  **Automated Version Increment**: Every successful CI deployment to main branch automatically increments the version using semantic versioning based on conventional commit message parsing (feat:, fix:, docs:, etc.)
2.  **Version Manifest System**: A machine-readable JSON file (`public/version-manifest.json`) is created and updated automatically during CI/CD pipeline containing version, commit hash, timestamp, description, and commit URL
3.  **Historical Git Analysis Script**: Create a rerunnable bootstrap script that analyzes existing commit history using conventional commit patterns, generates semantic versions for historical commits, and creates/updates the initial version manifest. Script must be repository-agnostic and handle different git histories gracefully
4.  **UI Display Component**: A footer indicator (similar to existing log tracing indicator) displays the current version and provides click-to-expand functionality showing version history modal/dropdown with navigation for the last 20 versions
5.  **New Version Flash Notification**: When a new version is detected (compared to local storage), display a prominent but non-intrusive flash/highlight notification to draw attention to the version change, with persistence to avoid repeated flashing
6.  **GitHub Integration**: Each version entry includes direct links to the corresponding GitHub commit for easy reference and troubleshooting
7.  **Access Control**: Version display and history are only visible when the authenticated user email matches david@ideasmen.com.au using the existing Convex auth system
8.  **Navigation Controls**: Previous/Next version browsing capability within the version history interface
9.  **Template Reusability**: Code architecture designed for template reuse where versioning logic and components can be copied to other applications, while each application maintains its own version manifest based on its specific commit history and development lifecycle
