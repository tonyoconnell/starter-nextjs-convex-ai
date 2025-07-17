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

# Cloudflare Pages Deployment
cd apps/web
bun run build:pages  # Build for Cloudflare Pages (includes CI=true flag)
bun run pages:deploy # Manual deployment via Wrangler CLI
bun run pages:dev    # Local development with Cloudflare Pages emulation

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

#### Cloudflare Pages Configuration

- **Auto-deployment**: Configured for `main` branch via Git integration
- **Build Command**: `bun run build && bun run pages:build`
- **Output Directory**: `.vercel/output/static`
- **Root Directory**: `apps/web`
- **Environment Variables**: `HUSKY=0` (required for CI)
- **Compatibility Flags**: `nodejs_compat` (required for Node.js runtime)

#### Critical Requirements

- **Next.js Config**: Must use `output: 'export'` for static generation
- **Images**: Must set `images: { unoptimized: true }` for Cloudflare compatibility
- **No wrangler.toml**: Use only Cloudflare Pages dashboard configuration
- **CI Compatibility**: Husky scripts must be disabled in CI environment

#### Deployment Commands

```bash
# Local testing
cd apps/web && bun run build:pages

# Manual deployment (testing only)
bun run pages:deploy

# Auto-deployment (production)
git push origin main  # Triggers automatic deployment
```

#### Troubleshooting

- See [Deployment Troubleshooting Guide](docs/technical-guides/cloudflare-pages-deployment-troubleshooting.md)
- Check build logs in Cloudflare Pages dashboard
- Verify compatibility flags are enabled for both Production and Preview environments

#### Convex Backend

- Convex functions deploy separately via `bunx convex deploy`
- Independent of Cloudflare Pages deployment
- Environment variables managed through Convex dashboard

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

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

## Claude Navigation & Directory Awareness

**CRITICAL**: Claude must maintain directory context awareness to prevent navigation errors.

### Navigation Best Practices

1. **Always verify current directory before file operations:**
   ```bash
   pwd  # Check current working directory
   ```

2. **Use absolute paths when referencing project files:**
   ```bash
   # Good
   /Users/.../starter-nextjs-convex-ai/.bmad-core/
   
   # Avoid relative paths that lose context
   ../../../.bmad-core/
   ```

3. **Explicitly navigate when changing directories:**
   ```bash
   cd /Users/.../starter-nextjs-convex-ai  # Return to project root
   ```

4. **When using LS tool, pay attention to the path context shown in output**

5. **For hidden directories (starting with .), use explicit listing:**
   ```bash
   ls -la | grep "^\."  # List hidden files/directories
   ```

### Common Directory Locations

- **Project Root**: `/Users/.../starter-nextjs-convex-ai/`
- **Web App**: `apps/web/`
- **Convex Backend**: `apps/convex/`
- **Documentation**: `docs/`
- **Agent Configs**: `.bmad-core/` (if exists)
- **Claude Config**: `.claude/` (if exists)

### Troubleshooting Navigation Issues

If you get "file not found" errors:
1. Run `pwd` to check current location
2. Navigate to project root: `cd /Users/.../starter-nextjs-convex-ai`
3. Use absolute paths for subsequent operations
4. Verify directory exists before accessing
