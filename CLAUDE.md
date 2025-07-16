# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js template designed for AI-first development using:
- **Next.js** (App Router) with TypeScript
- **Convex** for backend and real-time features
- **Tailwind CSS** + **ShadCN UI** for styling
- **Cloudflare** Pages/Workers for edge deployment
- **Bun** as the package manager

## Development Commands

```bash
# Development
bun dev              # Start development server
bun dev:claude       # Development with Claude logging integration

# Build & Production
bun build            # Build for production
bun start            # Start production server

# Testing
bun test             # Run Jest unit tests
bun test:e2e         # Run Playwright E2E tests
bun test:e2e:ui      # Run Playwright with UI mode

# Linting & Formatting
bun lint             # Run ESLint
bun format           # Run Prettier
bun typecheck        # Run TypeScript compiler checks

# Convex Backend
bunx convex dev      # Start Convex development server
bunx convex deploy   # Deploy Convex functions

# Claude Integration
bun chrome:debug     # Start Chrome with debugging port
bun claude:bridge    # Start Claude Dev Bridge for log capture
```

## Architecture & Key Patterns

### Directory Structure
```
/
├── apps/web/           # Next.js application
│   ├── app/           # App Router pages and layouts
│   ├── components/    # React components
│   ├── lib/          # Utilities and shared code
│   └── convex/       # Convex backend functions
├── packages/
│   ├── ui/           # Shared UI components library
│   └── convex/       # Shared Convex schemas/helpers
└── tests/            # E2E Playwright tests
```

### Key Architectural Patterns

1. **Convex Integration**
   - All backend logic lives in `convex/` directory
   - Use `useQuery` and `useMutation` hooks for data fetching
   - Real-time subscriptions are automatic with `useQuery`
   - Schema validation with Convex's built-in validators

2. **Component Architecture**
   - Server Components by default in `app/` directory
   - Client Components marked with `"use client"`
   - UI components use ShadCN pattern with Radix UI primitives
   - Form handling with `react-hook-form` and Zod validation

3. **State Management**
   - Server state: Convex (real-time, persistent)
   - Client state: Zustand (lightweight, type-safe)
   - Form state: react-hook-form with Zod schemas

4. **Authentication**
   - BetterAuth with Convex adapter
   - Session management through Convex
   - Protected routes using middleware

5. **Error Handling**
   - Sentry for production error tracking
   - Custom error boundaries for graceful degradation
   - Convex error handling with proper status codes

## Development Workflow

### AI-Assisted Development
This project follows the BMAD (Before, Model, After, Document) method:
1. Capture context before starting tasks
2. Use Claude for implementation
3. Verify and test results
4. Document changes and learnings

### BMAD Documentation Structure
The project uses sharded documentation for AI agent consumption:
- **[docs/prd/](docs/prd/)** - Sharded Product Requirements (Epic 1-7)
- **[docs/architecture/](docs/architecture/)** - Sharded Architecture components
- **[docs/methodology/](docs/methodology/)** - BMAD methodology guides

For systematic development, reference specific epics and architectural components as needed.

### Testing Strategy
- Unit tests for utilities and hooks
- Integration tests for Convex functions
- E2E tests for critical user flows
- Claude integration captures test results automatically

### Deployment
- Automatic deployment to Cloudflare Pages on push to main
- Convex functions deploy separately via `bunx convex deploy`
- Environment variables managed through Cloudflare dashboard

## Important Conventions

1. **File Naming**
   - Components: PascalCase (e.g., `UserProfile.tsx`)
   - Utilities: camelCase (e.g., `formatDate.ts`)
   - Convex functions: camelCase (e.g., `getUsers.ts`)

2. **TypeScript**
   - Strict mode enabled
   - Prefer interfaces over types for objects
   - Use Zod for runtime validation
   - Export types from Convex schemas

3. **Styling**
   - Tailwind utilities first
   - CSS modules for complex components
   - Follow ShadCN theming patterns

4. **Performance**
   - Use dynamic imports for heavy components
   - Optimize images with Next.js Image
   - Implement proper loading states
   - Cache Convex queries appropriately