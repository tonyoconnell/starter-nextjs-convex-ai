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

# CI Monitoring & Smart Push
bun run ci:status    # Check CI status for current branch
bun run ci:watch     # Monitor CI runs with real-time updates
bun run ci:logs      # View detailed CI logs
bun run push         # Smart push with pre-validation and CI monitoring
bun run push:no-ci   # Smart push without CI monitoring

# Systematic CI Verification (MANDATORY)
# These commands MUST be run after story completion and before marking complete
bun run typecheck    # TypeScript compilation verification
bun run lint         # ESLint validation
bun test             # Unit test execution (use npm test for component tests)
bun run ci:status    # Verify CI pipeline status
bun run ci:watch     # Monitor CI completion (when CI is running)

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

# Monitoring & Cleanup
bunx convex run cleanup:status                    # Check what needs cleaning with message patterns
bunx convex run monitoring:usage                  # Database usage stats and warnings
bunx convex run monitoring:traces                 # Find traces generating lots of logs

# Cleanup Commands (run multiple times until totalDeleted returns 0)
bunx convex run cleanup:safe                      # Normal maintenance - expired/old logs only
bunx convex run cleanup:force                     # Testing/emergency - delete ALL logs
./scripts/cleanup-logs.sh                         # Automated cleanup script
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

This project follows the BMAD (Before, Model, After, Document) method with integrated CI verification:

#### BMAD Phase Integration with CI Verification

1. **Before Phase**:
   - Capture context before starting tasks
   - **CI Context Check**: Run `bun run ci:status` to verify starting state
   - Document current CI status in planning

2. **Model Phase**:
   - Use Claude for implementation
   - **Include CI Considerations**: Plan implementation with CI compatibility in mind
   - Consider test requirements and CI pipeline impact

3. **After Phase**:
   - **MANDATORY CI Verification Suite**:
     ```bash
     pwd                    # Verify project root
     bun run typecheck     # TypeScript validation
     bun run lint          # ESLint compliance
     bun test              # Local test execution
     bun run build         # Production build test
     bun run ci:status     # CI pipeline verification
     ```
   - **DO NOT PROCEED** to Document phase until CI is green

4. **Document Phase**:
   - Document changes and learnings
   - **Include CI Lessons**: Capture any CI-related insights
   - Update testing documentation if CI patterns change

#### BMAD-CI Integration Rules

- **Never skip CI verification** in After phase - it's non-negotiable
- **CI failures block story completion** - fix before documenting
- **Document CI lessons** - maintain institutional CI knowledge
- **Use tester agent** for complex CI debugging during any phase

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

### CI Verification Process (MANDATORY)

**Critical Gap Identified**: Local tests passing ≠ CI success. The following systematic verification MUST be performed:

#### Before Story Completion (REQUIRED)

1. **Local Verification Suite**:

   ```bash
   # Run ALL verification commands in sequence
   pwd                    # Verify project root directory
   bun run typecheck     # TypeScript compilation check
   bun run lint          # ESLint validation
   bun test              # Unit tests (use npm test for React components)
   bun run build         # Production build verification
   ```

2. **CI Pipeline Verification**:

   ```bash
   # After pushing changes
   bun run ci:status     # Check current CI status
   bun run ci:watch      # Monitor CI execution (if running)

   # If CI fails, investigate immediately
   bun run ci:logs       # View detailed failure logs
   ```

#### Story Completion Checklist (NON-NEGOTIABLE)

**NEVER mark a story as complete until ALL of these pass:**

- [ ] **Local TypeScript**: `bun run typecheck` passes with 0 errors
- [ ] **Local Linting**: `bun run lint` passes with 0 warnings
- [ ] **Local Tests**: All test suites pass (unit + integration)
- [ ] **Local Build**: `bun run build` completes successfully
- [ ] **CI Pipeline**: `bun run ci:status` shows SUCCESS for latest commit
- [ ] **Deployment**: Site accessible and functional (for main branch)

#### When CI Verification Fails

**Immediate Actions Required:**

1. **Don't ignore CI failures** - they represent production environment issues
2. **Fix before proceeding** - no new work until CI is green
3. **Document lessons learned** - update testing documentation
4. **Use tester agent** - delegate complex CI debugging to testing specialist

#### Integration with BMAD Phases

**Before Phase**: Verify CI status of current branch  
**Model Phase**: Include CI considerations in implementation planning  
**After Phase**: Mandatory CI verification before completion  
**Document Phase**: Capture CI-related lessons learned

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
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.

## Specialized Agent Delegation

### Testing Infrastructure Work (MANDATORY)

**CRITICAL**: Testing work MUST involve the tester agent proactively, not just reactively when problems arise.

#### Mandatory Tester Agent Usage

**BEFORE implementing tests** (NON-NEGOTIABLE):

- [ ] **Strategy Planning**: Delegate test approach and patterns to tester agent
- [ ] **Requirements Analysis**: Have tester agent define coverage requirements
- [ ] **Framework Selection**: Confirm testing tools and setup with tester agent

**DURING test implementation**:

- [ ] **Infrastructure Issues**: Immediately delegate Jest/framework problems to tester agent
- [ ] **Complex Scenarios**: Use tester agent for accessibility and interaction testing
- [ ] **CI Integration**: Have tester agent handle CI testing configuration

**AFTER test implementation** (REQUIRED):

- [ ] **Coverage Review**: Tester agent MUST analyze coverage and patterns
- [ ] **Quality Assessment**: Delegate test quality evaluation to tester agent
- [ ] **Documentation**: Tester agent handles testing lessons learned documentation

#### Testing Agent Usage Pattern

```
Use Task tool with subagent_type: "tester" for:

PROACTIVE (before issues):
- Test strategy planning for new features
- Testing pattern establishment
- Coverage requirement definition
- CI testing integration planning

REACTIVE (when issues arise):
- Jest/testing framework debugging
- Test infrastructure troubleshooting
- Complex mocking scenarios
- Accessibility testing implementation

EVALUATIVE (after implementation):
- Test coverage analysis
- Testing pattern review
- Quality assessment
- Lessons learned documentation
```

#### Lessons from Story 4.1 Analysis

**Failure Pattern Identified**: Story 4.1 achieved 28/28 passing tests but failed to use tester agent proactively. This missed opportunities for:

- Better testing architecture
- More comprehensive patterns
- Systematic coverage analysis
- Testing infrastructure optimization

**Prevention Rule**: **NEVER** implement testing without tester agent involvement, even if local implementation succeeds.

#### Testing Workflow Integration

```bash
# MANDATORY workflow for ANY testing work:

# 1. BEFORE implementing tests
Task tool -> tester agent: "Plan test strategy for [component/feature]"

# 2. DURING implementation
Task tool -> tester agent: "Debug [specific testing issue]" (when issues arise)

# 3. AFTER implementation
Task tool -> tester agent: "Review test coverage and patterns for [feature]"
```

**Enforcement**: Any story involving testing MUST show evidence of tester agent delegation in story documentation.

## Testing Documentation Priority

When asked about testing or testing-related documentation:

1. **Technical/Developer Testing**: Focus on `docs/testing/technical/` first
   - **Debugging issues**: Start with `testing-infrastructure-lessons-learned.md`
   - **Writing tests**: Use `testing-patterns.md`
   - **Setup/standards**: Reference `test-strategy-and-standards.md`

2. **Functional/UAT Testing**: Only include UAT files from `docs/testing/uat/` when specifically requested for functional testing

3. **Key principle**: Technical testing docs are for developers writing/debugging tests. UAT docs are for product validation. Don't mix contexts unless explicitly asked.

## File Creation Discovery Protocol

Before creating ANY new files, Claude MUST follow this discovery protocol:

1. **Check Project Navigation**
   - Read `docs/index.md` first (central documentation navigation)
   - Check for existing patterns and directory structures
   - Look for relevant sections that show where new content should go

2. **Check BMAD Methodology**
   - Look for `.bmad-core/tasks/` directory for task-specific guidance
   - Check for templates in `.bmad-core/templates/`
   - Follow established naming conventions (e.g., `uat-plan-{epic}.{story}.md`)

3. **Verify File Placement**
   - Ensure new files follow existing documentation hierarchy
   - Update `docs/index.md` when adding new documentation
   - Use established directory patterns (e.g., `docs/testing/` for UAT files)

This protocol prevents incorrect file placement and maintains project consistency.

## Claude Navigation & Directory Awareness

**CRITICAL**: Claude must maintain directory context awareness to prevent navigation errors.

### Navigation Best Practices

**🚨 CRITICAL: ALWAYS run `pwd` as your FIRST command before any file operations!**

1. **MANDATORY directory verification before ANY commands:**

   ```bash
   pwd  # ALWAYS run this first - no exceptions!
   ```

2. **All commands must be run from project root:**

   ```bash
   # If not in project root, navigate immediately:
   cd /Users/davidcruwys/dev/ad/appydave/appydave-templates/starter-nextjs-convex-ai

   # Then verify you're in the right place:
   pwd
   ```

3. **Use absolute paths when referencing project files:**

   ```bash
   # Good - paths from project root
   docs/testing/index.md
   apps/web/components/ui/button.tsx

   # Avoid relative paths that lose context
   ../../../.bmad-core/
   ../../docs/testing/index.md
   ```

   **NEVER use `../..` patterns - always reference files from project root.**

4. **Before running any bun/npm scripts, confirm location:**

   ```bash
   pwd && bun run ci:status    # Combine directory check with command
   ```

5. **When using LS tool, pay attention to the path context shown in output**

6. **For hidden directories (starting with .), use explicit listing:**
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

If you get "file not found" or "script not found" errors:

1. **IMMEDIATELY run `pwd` to check current location**
2. **Navigate to project root:** `cd /Users/davidcruwys/dev/ad/appydave/appydave-templates/starter-nextjs-convex-ai`
3. **Verify you're in the right place:** `pwd` (should show the full project path)
4. **Test with a known file:** `ls package.json` (should exist at root)
5. **Then retry your original command**

**Common failure pattern:** Running commands from subdirectories like `apps/web/` when scripts expect project root context.

## CI Verification Scripts & Monitoring Tools

### Available CI Monitoring Scripts

The project includes comprehensive CI monitoring tools to support systematic verification:

#### 1. **CI Status Check** (`scripts/ci-status.sh`)

```bash
# Usage: Check current CI status for branch
bun run ci:status [branch-name]

# Features:
- Shows recent CI runs with status and timestamps
- Displays current pipeline status (success/failure/running)
- Provides direct GitHub Actions link
- Exit codes: 0=success, 1=failure, others=various states
```

#### 2. **CI Monitor** (`scripts/ci-monitor.sh`)

```bash
# Usage: Monitor CI execution with timeout
bun run ci:watch [branch-name] [timeout-seconds]

# Features:
- Real-time CI monitoring with status updates
- Configurable timeout (default: 300 seconds)
- Exit codes indicate final CI state
- Automatic link to detailed logs on failure
```

#### 3. **Smart Push with CI Integration** (`scripts/smart-push.sh`)

```bash
# Usage: Intelligent push with pre-validation
bun run push

# Workflow:
1. Pre-push validation (lint, typecheck, test)
2. Git operations (add, commit, push)
3. Automated CI monitoring
4. Success/failure reporting with actionable feedback
```

### CI Integration Best Practices

#### Systematic Use Pattern

```bash
# 1. Before starting work - verify baseline
bun run ci:status

# 2. During development - local validation
bun run typecheck && bun run lint && bun test

# 3. After implementation - comprehensive check
bun run build  # Verify production build
bun run push   # Smart push with CI monitoring

# 4. Story completion - final verification
bun run ci:status  # Confirm CI success before marking complete
```

#### Error Handling Workflow

```bash
# If CI fails after push:
bun run ci:logs        # View detailed failure logs
bun run ci:status      # Check current status
# Fix issues locally, then:
bun run push           # Re-push with monitoring
```

### Integration with Development Tools

#### GitHub CLI Integration

All CI scripts use GitHub CLI (`gh`) for authenticated API access:

- Automatic authentication detection
- Rich status reporting with timestamps
- Direct links to GitHub Actions dashboard

#### Exit Code Standards

- **0**: Success/completion
- **1**: Failure (CI failed, authentication issues)
- **2**: Cancelled operations
- **124**: Timeout reached
- **3+**: Various warning states

#### Monitoring Timeouts

- **Default**: 300 seconds (5 minutes) for most pipelines
- **Configurable**: Pass custom timeout as second argument
- **Smart Timeout**: Scripts provide progress updates and remaining time

### Documentation References

For comprehensive CI setup and troubleshooting:

- **[CI/CD Pipeline Setup Guide](docs/technical-guides/cicd-pipeline-setup.md)** - Complete setup instructions
- **[Testing Infrastructure Lessons](docs/testing/technical/testing-infrastructure-lessons-learned.md)** - CI debugging patterns
- **[Chat Component KDD](docs/testing/technical/chat-component-testing-lessons.md)** - Testing methodology improvements
