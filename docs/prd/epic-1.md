# Epic 1: Platform Foundation & End-to-End Deployment

**Goal:** To establish the complete project foundation by setting up the monorepo, configuring Convex, Cloudflare (Pages & Workers), and BetterAuth. This epic culminates in a fully automated CI/CD pipeline that deploys a minimal, authenticated page, proving the entire stack works end-to-end.

---
## Story 1.1: Monorepo & Tooling Initialization
*As a developer, I want a new project initialized with a Bun-based Turborepo and essential DX tooling, so that I have a clean, consistent, and high-quality starting point for development.*

**Acceptance Criteria:**
1.  A new project directory is created and initialized as a Git repository.
2.  The project is configured as a Bun-based monorepo using Turborepo.
3.  The root `package.json` includes scripts for linting, testing, and formatting.
4.  ESLint, Prettier, Husky, and commitlint are configured at the root level.
5.  The basic monorepo folder structure (`apps`, `packages`) is created.

---
## Story 1.2: Basic Next.js App Shell
*As a developer, I want a basic Next.js application shell set up within the monorepo, so that I have a place to start building the user interface.*

**Acceptance Criteria:**
1.  A new Next.js application is created within the `apps/web` directory.
2.  The application includes a single homepage (`/`) that displays a "Welcome" message.
3.  The application successfully runs locally using the `bun run dev` command.
4.  The application is configured with TypeScript (Strict Mode) and Tailwind CSS.

---
## Story 1.3: Cloudflare Pages Deployment
*As a developer, I want the basic Next.js app to be deployable via Cloudflare Pages, so that I can view the application on a public URL and validate the hosting setup.*

**Acceptance Criteria:**
1.  A Cloudflare Pages project is configured for the `apps/web` application.
2.  The Next.js adapter for Cloudflare is installed and configured.
3.  A manual deployment to Cloudflare Pages succeeds.
4.  The "Welcome" page is accessible at the provided `*.pages.dev` URL.

---
## Story 1.4: Convex Backend Integration
*As a developer, I want the Next.js frontend to be connected to a Convex backend project, so that the foundation for real-time data and server logic is in place.*

**Acceptance Criteria:**
1.  A new Convex project is initialized and linked to the `apps/convex` directory.
2.  The `ConvexProvider` is correctly configured to wrap the Next.js application.
3.  A simple test query is created in Convex and called from the homepage to confirm the connection.

---
## Story 1.5: Foundational Authentication
*As a user, I want to be able to sign up, log in, and log out of the application, so that my identity can be securely managed.*

**Acceptance Criteria:**
1.  BetterAuth is integrated with the Convex backend and the Next.js frontend.
2.  The UI includes functional "Login" and "Logout" buttons.
3.  A user can successfully sign up for a new account.
4.  Upon login, the user's session is established and can be verified.
5.  A basic client-side protected component or page is created that is only visible to authenticated users.

---
## Story 1.8: Extended Authentication Features
*As a user, I want comprehensive authentication features including password management, social login, and security controls, so that I have a complete, production-ready authentication experience.*

**Acceptance Criteria:**
1. Users can change their password through a secure change password form.
2. Users can reset their password via email when forgotten.
3. New user accounts require email verification before full activation.
4. Users can sign in with GitHub OAuth integration.
5. Users can sign in with Google OAuth integration.
6. Users can edit their profile information (name, email, avatar).
7. Users can view and manage their active sessions.
8. Users have optional two-factor authentication (2FA) for enhanced security.
9. Users can enable "Remember Me" functionality for persistent sessions.
10. Account lockout protection prevents brute force attacks.
11. Users can deactivate or delete their accounts.
12. All authentication events are logged for security audit.

**Technical Requirements:**
- Integrate BetterAuth social providers (GitHub, Google)
- Implement secure password reset flow with time-limited tokens
- Add email verification system with activation links
- Create 2FA system with TOTP (Time-based One-Time Password)
- Implement session management dashboard
- Add security audit logging
- Ensure GDPR compliance for account deletion
- Maintain backward compatibility with existing authentication

**Security Considerations:**
- All password reset tokens expire within 1 hour
- Email verification links expire within 24 hours
- Failed login attempts trigger progressive delays
- 2FA backup codes for recovery scenarios
- Secure session storage and rotation
- Rate limiting on authentication endpoints

---
## Story 1.6: Automated CI/CD Pipeline
*As a developer, I want a CI/CD pipeline in GitHub Actions, so that every push to the main branch is automatically tested and deployed.*

**Acceptance Criteria:**
1.  A GitHub Actions workflow file is created in `.github/workflows/`.
2.  The workflow triggers automatically on push to the `main` branch.
3.  The pipeline includes jobs for linting, testing, and building the applications.
4.  If all jobs pass, the pipeline automatically deploys the app to Cloudflare Pages.
5.  The pipeline fails and blocks deployment if any job fails.

---
## Story 1.7: Port Management Documentation
*As a developer, I want a clear port management strategy documented, so that I can avoid conflicts between my local development server and AI-driven test runners.*

**Acceptance Criteria:**
1.  A `CONTRIBUTING.md` or `docs/development-guide.md` file is created.
2.  The document outlines reserved network ports for different processes (e.g., Main dev server, Storybook, AI Test Runners).
3.  The document provides clear instructions on how to configure these ports.