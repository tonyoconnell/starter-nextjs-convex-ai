# Testing Infrastructure KDD: Lessons Learned from Story 1.9

## Executive Summary

This document captures extensive challenges and solutions encountered while implementing comprehensive testing infrastructure for Story 1.9. What should have been a straightforward Jest setup became a complex integration challenge involving Next.js compatibility, ESLint configuration, CI/CD environment issues, git workflow problems, and Convex conflicts. This document captures critical knowledge to prevent future development pain.

## ⚠️ CRITICAL WARNING: CI Verification Workflow

**NEVER declare "CI is working" without:**

1. **Pushing changes to remote repository**
2. **Monitoring actual CI pipeline completion** (`bun run ci:watch`)
3. **Verifying ALL CI steps pass** (not just local tests)

**Local tests passing ≠ CI working**. This mistake was made repeatedly, causing user frustration and wasted time. See Section 7 for detailed analysis.

## Background Context

**Story**: 1.9 - Comprehensive Testing Infrastructure  
**Duration**: Multiple sessions across several iterations  
**Scope**: Jest unit testing, React Testing Library integration, CI/CD pipeline testing  
**Initial Expectation**: Simple Jest setup with existing Next.js project  
**Reality**: Complex multi-system integration requiring deep configuration troubleshooting

## Critical Lessons Learned

### 1. Jest + Next.js Integration Complexity

#### The Problem

Modern Next.js projects (App Router) have complex compatibility requirements with Jest that aren't immediately obvious from documentation.

#### Key Issues Encountered

- **Version compatibility**: Jest 30.x with Next.js 15.x required specific configuration
- **Module resolution**: TypeScript path mapping conflicts with Jest module resolution
- **Environment setup**: Browser globals (window, document, sessionStorage) needed careful configuration
- **Transform issues**: Next.js components required specific Jest transforms

#### Solution Pattern

```javascript
// jest.config.mjs - Critical configuration
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          jsx: 'react-jsx',
        },
      },
    ],
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
};
```

#### Future Avoidance Strategy

- Always check Next.js + Jest compatibility matrix before setup
- Use official Next.js testing documentation as primary source
- Test module resolution early with simple import tests

### 2. ESLint Configuration Hell

#### The Problem

ESLint rules designed for production code conflicted with testing infrastructure, causing pre-commit hooks to block all commits.

#### Key Issues Encountered

- **Jest globals undefined**: `describe`, `it`, `expect` not recognized
- **Config file restrictions**: ESLint rules preventing `process.env` access in config files
- **Test file exemptions**: Testing utilities needed different rule sets

#### Solution Pattern

```javascript
// eslint.config.js - Critical overrides
export default [
  {
    languageOptions: {
      globals: {
        // Jest globals - REQUIRED
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  },
  // Config files override - CRITICAL
  {
    files: [
      '**/jest.config.js',
      '**/jest.setup.js',
      '**/*.config.js',
      '**/*.config.ts',
    ],
    rules: {
      'no-restricted-syntax': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
    },
  },
  // Test files override
  {
    files: ['**/__tests__/**/*', '**/*.test.*', '**/*.spec.*'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
];
```

#### Future Avoidance Strategy

- Add Jest globals to ESLint config BEFORE writing any tests
- Create file-specific overrides for config and test files upfront
- Test ESLint + pre-commit hooks early in setup process

### 3. CI/CD Environment Configuration Gotchas

#### The Problem

Tests that passed locally failed in CI due to environment variable conflicts, specifically React Testing Library production build restrictions.

#### Key Issues Encountered

- **NODE_ENV confusion**: Global `NODE_ENV=production` broke React Testing Library
- **Test environment isolation**: CI needed `NODE_ENV=test` for test steps
- **Coverage thresholds**: Convex app had no tests but CI expected coverage reports

#### Solution Pattern

```yaml
# .github/workflows/ci.yml - Critical environment setup
jobs:
  test:
    env:
      NODE_ENV: production # Global setting
    steps:
      - name: Run unit tests with coverage
        env:
          NODE_ENV: test # Override for test steps - CRITICAL
        run: |
          cd apps/web && bun run test:ci
          cd ../convex && bun run test:coverage
```

```json
// apps/convex/package.json - Handle empty test suites
{
  "scripts": {
    "test:coverage": "jest --coverage --passWithNoTests"
  }
}
```

#### Future Avoidance Strategy

- Always set `NODE_ENV=test` for test execution steps in CI
- Use `--passWithNoTests` flag for optional test suites
- Test CI pipeline with actual environment variables early

### 4. Git Workflow Monorepo Issues

#### The Problem

Git operations executed from subdirectories (`apps/web`) only staged files in that directory, missing changes in other parts of the monorepo.

#### Key Issues Encountered

- **Partial commits**: Only web app files committed, missing convex and root changes
- **Repository root awareness**: Need to ensure git operations run from repository root
- **Claude Code commands**: Command files needed updates to prevent partial commits

#### Solution Pattern

```bash
# Always navigate to repository root before git operations
cd $(git rev-parse --show-toplevel)
git add .
git commit -m "message"
git push
```

#### Claude Code Command Updates

```markdown
<!-- ~/.claude/commands/push.md -->

Push changes with autogenerated commit message (stage, commit, push in one step)

- Stage all changes, commit with descriptive message, and push to remote
- Ensure git operations are run from repository root to avoid partial commits
- Do not ask for confirmation — execute all steps automatically
```

#### Future Avoidance Strategy

- Always run git operations from repository root in monorepo projects
- Update Claude Code commands to enforce repository root operations
- Test git workflow with changes across multiple directories early

### 5. Convex + Jest Coverage Conflicts

#### The Problem

Jest coverage reports generated in `apps/convex/coverage/` directory caused Convex dev server to fail, as it tried to sync HTML/JS coverage files as Convex modules.

#### Key Issues Encountered

- **Invalid module paths**: `lcov-report` contains hyphens not allowed in Convex module paths
- **Coverage directory syncing**: Convex `"functions": "."` included everything in directory
- **Module naming restrictions**: Convex requires alphanumeric + underscore + periods only

#### Solution Pattern

```json
// apps/convex/convex.json - Critical ignore paths
{
  "functions": ".",
  "ignoredPaths": [
    "coverage/**/*",
    "node_modules/**/*",
    "*.test.ts",
    "jest.config.js",
    "jest.setup.js"
  ]
}
```

```gitignore
# apps/convex/.gitignore
.env.local
coverage/
```

#### Future Avoidance Strategy

- Add `ignoredPaths` to `convex.json` before setting up testing
- Include coverage directories in `.gitignore` from start
- Test Convex dev server after adding any new file types

## Technical Implementation Patterns

### Browser Globals Setup

```javascript
// jest.setup.js - Centralized browser globals
// Global mocks for browser APIs
global.window = global.window || {};
global.document = global.document || {};
global.navigator = global.navigator || { userAgent: 'test' };

// SessionStorage mock with error handling
Object.defineProperty(global.window, 'sessionStorage', {
  value: {
    getItem: jest.fn(key => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});
```

### Test Environment Configuration

```javascript
// test-config/setup-test-env.js
function setupTestEnvironment() {
  // Set CI-specific environment variables
  if (process.env.CI) {
    process.env.NODE_ENV = 'test';
    process.env.NEXTJS_SKIP_PREFLIGHT = 'true';
  }
}
```

### React Testing Library Best Practices

```typescript
// Component test pattern
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Always use userEvent for interactions
const user = userEvent.setup();
await user.click(button);
await user.type(input, 'text');

// Proper async handling
await waitFor(() => {
  expect(screen.getByText('Expected text')).toBeInTheDocument();
});
```

## Process Improvements

### 1. Testing Infrastructure Checklist

- [ ] Check Next.js + Jest compatibility matrix
- [ ] Configure ESLint with Jest globals upfront
- [ ] Set up file-specific ESLint overrides for config/test files
- [ ] Configure CI with proper NODE_ENV for test steps
- [ ] Add `--passWithNoTests` for optional test suites
- [ ] Update git workflow to operate from repository root
- [ ] Configure Convex `ignoredPaths` before testing setup
- [ ] **Add Convex build script for client code generation**
- [ ] Test complete pipeline early with dummy tests
- [ ] **CRITICAL: Establish CI verification workflow (push + monitor real CI)**

### 2. Early Detection Strategies

- **Local validation**: Run `bun run lint && bun run test && bun run build` before committing
- **CI validation**: **MANDATORY - Push changes and monitor real CI with `bun run ci:watch`**
- **Integration testing**: Verify all tools work together before writing complex tests
- **Environment parity**: Ensure local and CI environments match
- **Never trust local success**: Local tests passing ≠ CI working

### 3. Configuration Management

- **Centralized config**: Keep test configuration in root-level files when possible
- **Documentation**: Document all configuration decisions and their reasoning
- **Version tracking**: Commit all configuration files to prevent drift
- **Backup strategy**: Keep working configurations before making changes

## Metrics and Success Criteria

### Final State Achieved

- **Test Success Rate**: 100% (11/11 suites passing, 77/80 tests passing, 3 skipped)
- **CI/CD Pipeline**: Fully functional with automatic deployment
- **Development Workflow**: Smooth local development with proper git operations
- **Tool Integration**: All tools (Jest, ESLint, Convex, CI) working harmoniously

### Performance Impact

- **Local test execution**: ~15 seconds for full test suite
- **CI pipeline duration**: ~3-4 minutes end-to-end
- **Developer productivity**: Restored after resolving configuration conflicts

## Future Recommendations

### For Similar Projects

1. **Start with official documentation**: Use Next.js official testing docs as primary source
2. **Incremental setup**: Add one tool at a time and verify integration
3. **Early CI testing**: Test CI pipeline with minimal configuration first
4. **Configuration templates**: Create reusable configuration templates for similar projects

### For Team Knowledge Sharing

1. **Configuration audit**: Review all configuration files quarterly
2. **Documentation maintenance**: Keep this KDD updated with new lessons
3. **Onboarding checklist**: Use this document for new team member onboarding
4. **Best practices sharing**: Regular team sessions on testing infrastructure

### 6. Test Coverage Implementation Lessons

#### The Problem

Achieving high test coverage requires systematic approaches to complex mocking scenarios, especially for singleton services and external dependencies.

#### Key Issues Encountered

- **Singleton pattern testing**: AuthService singleton required special handling for test isolation
- **Complex mocking**: Convex client + API mocking required understanding import/export patterns
- **Coverage optimization**: Strategic test writing to maximize coverage impact
- **Branch coverage**: Error handling paths often missed without systematic approach

#### Solution Pattern

```typescript
// Comprehensive mocking strategy
jest.mock('../convex', () => ({
  convex: {
    mutation: jest.fn(),
    query: jest.fn(),
    action: jest.fn(),
  },
}));

jest.mock('../../convex/api', () => ({
  api: {
    auth: {
      registerUser: 'auth/registerUser',
      // ... map all API endpoints
    },
  },
}));

// Singleton testing pattern
beforeEach(() => {
  (AuthService as any).instance = undefined; // Reset singleton
});
```

#### Coverage Achievement Results

- **lib/auth.ts**: 99.31% statements, 87.09% branches (from ~25%)
- **Overall coverage**: 86.7% statements, 79.49% branches (from ~60%)
- **57 comprehensive test cases** covering all auth methods and error scenarios

#### Future Avoidance Strategy

- Plan mocking strategy before writing tests
- Focus on high-impact files first (services, utilities)
- Write error path tests systematically
- Use coverage reports to identify gaps strategically

### 7. Critical CI Verification Workflow Failures

#### The Problem

A fundamental workflow error where local test success was incorrectly equated with CI success, leading to repeated false "CI is fixed" declarations without actual verification.

#### Key Issues Encountered

- **False CI success claims**: Declaring "CI is working" after local fixes without pushing changes
- **No actual verification**: Never checking real CI pipeline status after making fixes
- **Multiple failure cascades**: Each fix revealed new issues that weren't caught locally
- **User frustration**: Pattern repeated multiple times causing loss of trust

#### Critical Workflow Error Pattern

```bash
# ❌ WRONG - What was happening:
1. User: "CI is failing"
2. Make local changes
3. Run `bun run test:ci` locally ✅
4. Declare "CI is now working!" ❌ (NEVER VERIFIED)

# ✅ CORRECT - Required workflow:
1. User: "CI is failing"
2. Make local changes
3. Run tests locally to validate
4. **Commit and push changes**
5. **Monitor actual CI pipeline** (`bun run ci:watch`)
6. **Only then** declare CI is working
```

#### Root Cause Analysis

The three separate CI failures revealed:

1. **Test execution issues** - HTML5 validation preventing test scenarios
2. **Configuration conflicts** - Duplicate test runs (limited vs full suite)
3. **Missing build dependencies** - Convex client code generation not configured

#### Solution Pattern

**Mandatory CI Verification Protocol:**

```bash
# After making any CI-related changes:
git add . && git commit -m "fix: description"
git push
bun run ci:watch  # Monitor real pipeline
# Wait for actual CI completion before declaring success
```

**Never declare CI success without:**

- ✅ Pushing changes to remote
- ✅ Monitoring actual CI pipeline completion
- ✅ Verifying all CI steps pass (not just tests)

#### Future Avoidance Strategy

- **Always push first**: No CI declarations without pushing changes
- **Use monitoring tools**: `bun run ci:watch` for real-time verification
- **Document all failures**: Each CI failure type should be captured for pattern recognition
- **Test the full pipeline**: Local tests ≠ CI environment

### 8. Test Environment and Tooling Challenges

#### The Problem

Test runner selection and environment configuration significantly impact development velocity and coverage accuracy.

#### Key Issues Encountered

- **Bun vs Jest**: `bun test` didn't properly support Jest mocking patterns
- **Coverage accuracy**: Only `npx jest --coverage` gave accurate coverage reports
- **Mock hoisting**: Variable hoisting issues with `jest.mock()` required specific patterns
- **Test isolation**: Global state leakage between tests

#### Solution Pattern

```bash
# Always use Jest directly for accurate coverage
npx jest --coverage

# Not: bun test (mocking issues)
# Not: bun run test (environment issues)
```

```typescript
// Proper mock hoisting pattern
jest.mock('../module', () => ({
  export: mockValue, // Define inline, not as variable
}));

// Not: const mockValue = ...; jest.mock(() => ({ export: mockValue }))
```

#### Future Avoidance Strategy

- Use Jest directly for all test execution
- Understand test runner limitations early
- Test mocking patterns with simple cases first
- Establish test isolation patterns upfront

## Advanced Testing Patterns Learned

### 1. Component Testing with Context Providers

```typescript
// Custom render with providers pattern
function renderWithProviders(ui: React.ReactElement, options = {}) {
  const AllProviders = ({ children }: { children: React.ReactNode }) => (
    <ConvexProvider client={mockConvexClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ConvexProvider>
  );

  return render(ui, { wrapper: AllProviders, ...options });
}
```

### 2. Async State Testing Patterns

```typescript
// Proper async testing with React Testing Library
it('handles async state updates', async () => {
  const mockFn = jest.fn().mockResolvedValue(mockData);
  render(<Component />);

  fireEvent.click(screen.getByText('Load Data'));

  await waitFor(() => {
    expect(screen.getByText('Loaded Data')).toBeInTheDocument();
  });

  expect(mockFn).toHaveBeenCalledTimes(1);
});
```

### 3. Error Boundary Testing

```typescript
// Test error scenarios systematically
it('handles service errors gracefully', async () => {
  mockConvex.mutation.mockRejectedValue(new Error('Service error'));

  const result = await authService.register('test', 'email', 'pass');

  expect(result.success).toBe(false);
  expect(result.error).toBe('Service error');
});
```

## Test Organization and Maintenance

### 1. File Organization Patterns

```
__tests__/
├── components/          # Component tests
├── services/           # Service layer tests
├── utils/              # Utility function tests
├── integration/        # Integration tests
└── fixtures/           # Test data and mocks
```

### 2. Test Data Management

```typescript
// Centralized test fixtures
export const mockUser = {
  _id: 'test-id',
  name: 'Test User',
  email: 'test@example.com',
  // ... complete mock object
};

export const createMockAuthResult = (overrides = {}) => ({
  success: true,
  user: mockUser,
  ...overrides,
});
```

### 3. Coverage-Driven Development Process

1. **Baseline measurement**: Establish current coverage
2. **Gap analysis**: Identify high-impact, low-coverage files
3. **Strategic testing**: Target files with biggest coverage impact
4. **Incremental improvement**: Aim for 10-15% coverage increase per iteration
5. **Maintenance**: Regular coverage reviews and gap filling

## Related Testing Documentation

This document is part of a comprehensive testing knowledge system:

### **Core Testing Knowledge**

- **[Test Strategy and Standards](../../architecture/test-strategy-and-standards.md)** - Overall testing strategy and coverage standards
- **[Testing Patterns](../../patterns/testing-patterns.md)** - Reusable testing patterns and implementation examples

### **Implementation Guides**

- **[CI/CD Pipeline Setup](../../technical-guides/cicd-pipeline-setup.md)** - Complete CI/CD setup with testing
- **[Cloudflare Pages GitHub Actions Example](../../examples/cicd-deployment/cloudflare-pages-github-actions.md)** - Working CI/CD implementation

### **Cross-References**

- **Section 7**: Critical CI verification workflow (referenced by all CI/CD guides)
- **Process Improvements**: Testing infrastructure checklist (used in setup guides)
- **Technical Patterns**: Mocking and configuration patterns (referenced in testing patterns)

## Conclusion

The testing infrastructure implementation revealed the hidden complexity of modern JavaScript toolchain integration. While the final result is robust and comprehensive, the path required deep technical knowledge across multiple systems. This document serves as a critical reference to prevent future teams from experiencing the same challenges and to accelerate similar implementations.

The key insight is that testing infrastructure is not just about writing tests—it's about orchestrating a complex ecosystem of tools that must work harmoniously across development, CI/CD, and deployment environments.

**Additional Insight**: Achieving high test coverage (86.7% statements, 79.49% branches) requires systematic approaches to mocking, strategic test planning, and understanding of coverage optimization patterns. The investment in comprehensive testing infrastructure pays dividends in code quality and developer confidence.
