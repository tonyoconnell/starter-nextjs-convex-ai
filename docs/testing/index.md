# Testing Documentation

This directory contains all testing-related documentation organized by purpose and audience.

## 📊 Test System Overview

**Complete Test Inventory**: [Testing System Manifest](../features/manifests/testing-system.manifest.json) - Comprehensive view of all 94 test files across centralized and distributed locations

**Historical Metrics**: [Test Metrics Tracking](test-metrics.json) - Success/failure trends, coverage analysis, and performance tracking over time

### Current Testing Approach

**Hybrid Model** (Target: Centralized):

- **Centralized Tests** (`/tests/`) - 58 files: Cross-cutting concerns, integration tests, worker tests
- **Distributed Tests** (`/apps/web/__tests__/`) - 36 files: Component-adjacent tests (legacy approach)
- **Migration Status**: Incomplete - many tests duplicated between locations

## For Developers (Technical Testing)

**Priority reading for writing tests and debugging test issues:**

### 🔥 Essential Files

- **[Testing Infrastructure Lessons Learned](technical/testing-infrastructure-lessons-learned.md)** - **START HERE for debugging** - Real problems encountered and solutions found, including Jest + Next.js integration gotchas, ESLint configuration conflicts, CI environment differences
- **[Testing Patterns](technical/testing-patterns.md)** - **For implementation** - Concrete patterns for testing React components, hooks, Convex functions, mocking strategies, error path testing
- **[Test Strategy & Standards](technical/test-strategy-and-standards.md)** - **For context** - Testing framework, coverage targets, toolchain standards, CI/CD integration

### Quick Reference

- **Complete test inventory?** → Check [Testing System Manifest](../features/manifests/testing-system.manifest.json)
- **Historical test trends?** → Review [Test Metrics](test-metrics.json)
- **Debugging tests that fail?** → Start with lessons-learned
- **Writing new tests?** → Use testing-patterns
- **Setting up testing infrastructure?** → Follow test-strategy-and-standards
- **Migration guidance?** → See test-migration-and-configuration-kdd

## For QA/Product (Story Acceptance Testing)

**Story completion validation and acceptance verification:**

### Story Acceptance Tests

**Epic 1 - Platform Foundation:**

- [Story 1.2 - Basic Next.js App Shell](../template-development/testing/stories/story-acceptance-test-1.2.md)
- [Story 1.4 - Convex Backend Integration](../template-development/testing/stories/story-acceptance-test-1.4.md)
- [Story 1.5 - Authentication System](../template-development/testing/stories/story-acceptance-test-1.5.md)
- [Story 1.6 - User Dashboard](../template-development/testing/stories/story-acceptance-test-1.6.md)
- [Story 1.7 - GitHub OAuth](../template-development/testing/stories/story-acceptance-test-1.7.md)
- [Story 1.8 - Profile Management](../template-development/testing/stories/story-acceptance-test-1.8.md)

**Epic 2 - UI Toolkit & Component Showcase:**

- [Story 2.1 - Integrate ShadCN/UI Library](../template-development/testing/stories/story-acceptance-test-2.1.md)

**Epic 3 - Resilient Real-time Logging:**

- [Story 3.1 - Browser Log Capture Foundation](../template-development/testing/stories/story-acceptance-test-3.1.md)
- [Story 3.2 - Multi-System Log Ingestion & Correlation](../template-development/testing/stories/story-acceptance-test-3.2.md)
- [Story 3.4 - Log Filtering & Search](../template-development/testing/stories/story-acceptance-test-3.4.md)
- [Story 3.6 - Admin Logging System](../template-development/testing/stories/story-acceptance-test-3.6.md)

**Epic 4 - AI-Powered Chat Interface:**

- [Story 4.2 - Knowledge Ingestion Service](../template-development/testing/stories/story-acceptance-test-4.2.md)

## Testing Commands Reference

```bash
# Unit & Integration Tests
bun test              # Run Jest unit tests
bun test:watch        # Run tests in watch mode

# End-to-End Tests
bun test:e2e          # Run Playwright E2E tests
bun test:e2e:ui       # Run Playwright with UI mode

# Code Quality
bun lint              # Run ESLint
bun typecheck         # Run TypeScript compiler checks
bun format            # Run Prettier

# CI Testing
bun test:ci           # Run tests in CI mode with coverage
```

## Test Organization Structure

### Documentation Structure

```
docs/testing/
├── index.md                    # This file - testing documentation overview
├── test-metrics.json          # Historical test success/failure tracking
├── technical/                  # Developer-focused testing documentation
│   ├── test-strategy-and-standards.md
│   ├── testing-patterns.md
│   ├── testing-infrastructure-lessons-learned.md
│   └── test-migration-and-configuration-kdd.md
└── ../template-development/testing/stories/  # Story acceptance testing documentation
    ├── story-acceptance-test-1.2.md
    ├── story-acceptance-test-1.4.md
    ├── story-acceptance-test-1.5.md
    ├── story-acceptance-test-1.6.md
    ├── story-acceptance-test-1.7.md
    ├── story-acceptance-test-1.8.md
    ├── story-acceptance-test-2.1.md
    ├── story-acceptance-test-3.1.md
    ├── story-acceptance-test-3.2.md
    ├── story-acceptance-test-3.4.md
    ├── story-acceptance-test-3.6.md
    └── story-acceptance-test-4.2.md
```

### Test File Organization

**Current Hybrid Approach** (94 total test files):

**✅ Centralized Location** (`/tests/`) - **Target approach**:

```
tests/
├── web/                       # 43 files - Web app components & logic
├── convex/                    # 11 files - Backend functions
└── workers/                   # 8 files - Cloudflare Worker tests
```

**⚠️ Distributed Location** (`/apps/web/__tests__/`) - **Legacy approach**:

```
apps/web/
├── components/*/__tests__/    # 32 files - Component-adjacent tests
├── lib/*/__tests__/          # 2 files - Utility tests
└── __tests__/                # 4 files - Business logic tests
```

**Migration Status**: Many tests exist in both locations. See [Testing System Manifest](../features/manifests/testing-system.manifest.json) for complete duplication analysis and migration recommendations.
