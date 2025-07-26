# Testing Patterns

## Overview

This document outlines established patterns for testing across all layers of the application, including unit tests, integration tests, and end-to-end testing.

## Unit Testing Patterns

### Component Testing with React Testing Library

**Context**: Testing React components in isolation
**Implementation**:

- Use `@testing-library/react` for component testing
- Test user interactions, not implementation details
- Use proper queries (getByRole, getByLabelText)
- Mock external dependencies

**Example**:

```typescript
// Custom render function with providers
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConvexProvider } from 'convex/react';
import { AuthProvider } from '../auth-provider';

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

// Component test with user interactions
describe('LoginForm', () => {
  it('should submit form when valid credentials provided', async () => {
    const mockLogin = jest.fn().mockResolvedValue({ success: true });
    jest.mocked(useAuth).mockReturnValue({ login: mockLogin });

    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });
});
```

**Rationale**: Ensures components work correctly from user perspective

### Hook Testing

**Context**: Testing custom React hooks
**Implementation**:

- Use `@testing-library/react-hooks` for hook testing
- Test hook behavior and state changes
- Mock dependencies appropriately
- Test error conditions

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Validates hook logic independently of components

### Utility Function Testing

**Context**: Testing pure functions and utilities
**Implementation**:

- Use Jest for utility function testing
- Test edge cases and error conditions
- Use descriptive test names
- Group related tests with describe blocks

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures utility functions behave correctly across all scenarios

## Integration Testing Patterns

### Convex Function Testing

**Context**: Testing Convex queries, mutations, and actions
**Implementation**:

- Use Convex testing utilities
- Test with realistic data scenarios
- Mock external API calls in actions
- Validate database state changes

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures backend functions work correctly with real data

### API Integration Testing

**Context**: Testing complete API workflows
**Implementation**:

- Test end-to-end API scenarios
- Use test database instances
- Validate real-time subscriptions
- Test error handling and recovery

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Validates complete backend workflows

### Authentication Testing

**Context**: Testing authentication and authorization
**Implementation**:

- Test authenticated and unauthenticated states
- Validate permission checks
- Test session management
- Mock authentication providers

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures security measures work correctly

## End-to-End Testing Patterns

### Playwright E2E Testing

**Context**: Testing complete user workflows
**Implementation**:

- Use Playwright for browser automation
- Test critical user journeys
- Handle async operations properly
- Use page object patterns for maintainability

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Validates application works correctly for real users

### Cross-Browser Testing

**Context**: Ensuring compatibility across browsers
**Implementation**:

- Test on Chrome, Firefox, and Safari
- Validate responsive design
- Test accessibility features
- Handle browser-specific behaviors

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures consistent user experience across platforms

## Test Data Management

### Test Data Fixtures

**Context**: Managing test data across tests
**Implementation**:

- Use consistent test data factories
- Create minimal, focused test data
- Clean up test data after tests
- Use realistic but not real data

**Example**:

```typescript
// Centralized test fixtures
export const mockUser = {
  _id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  profile_image_url: 'https://example.com/avatar.jpg',
  role: 'user',
  _creationTime: Date.now(),
};

export const createMockAuthResult = (overrides = {}) => ({
  success: true,
  user: mockUser,
  sessionToken: 'mock-session-token',
  ...overrides,
});

// Usage in tests
describe('Authentication', () => {
  it('should handle successful login', async () => {
    const expectedResult = createMockAuthResult();
    mockConvex.mutation.mockResolvedValue(expectedResult);

    const result = await authService.login('test@example.com', 'password');

    expect(result).toEqual(expectedResult);
  });

  it('should handle login failure', async () => {
    const failureResult = createMockAuthResult({
      success: false,
      user: null,
      error: 'Invalid credentials',
    });

    mockConvex.mutation.mockResolvedValue(failureResult);

    const result = await authService.login('wrong@example.com', 'wrong');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid credentials');
  });
});
```

**Rationale**: Provides reliable, predictable test environments

### Database Seeding

**Context**: Setting up test database state
**Implementation**:

- Use database seeding for integration tests
- Create isolated test environments
- Reset state between tests
- Use transactions for cleanup

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures tests run in predictable, isolated environments

## Mocking Patterns

### External API Mocking

**Context**: Mocking external service calls
**Implementation**:

- Mock external APIs consistently
- Use realistic response data
- Test both success and failure scenarios
- Mock network delays when relevant

**Example**:

```typescript
// Comprehensive service mocking pattern
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
      loginUser: 'auth/loginUser',
      // Map all API endpoints as strings
    },
  },
}));

// Service testing with comprehensive error scenarios
describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton for proper test isolation
    (AuthService as any).instance = undefined;
  });

  it('should handle service errors gracefully', async () => {
    mockConvex.mutation.mockRejectedValue(new Error('Network error'));

    const result = await authService.register('test', 'email', 'pass');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('should handle uncaught error format', async () => {
    const error = new Error('Uncaught Error: Database connection failed');
    mockConvex.mutation.mockRejectedValue(error);

    const result = await authService.register(
      'Test',
      'test@example.com',
      'pass'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database connection failed');
  });
});
```

**Rationale**: Provides reliable tests independent of external services

### Time and Date Mocking

**Context**: Testing time-dependent functionality
**Implementation**:

- Mock system time for predictable tests
- Test timezone handling
- Validate date calculations
- Test time-based business logic

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures time-dependent features work correctly

## Performance Testing Patterns

### Load Testing

**Context**: Testing application performance under load
**Implementation**:

- Use appropriate load testing tools
- Test database performance
- Validate API response times
- Monitor resource usage

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures application performs well under realistic load

### Bundle Size Testing

**Context**: Monitoring frontend bundle sizes
**Implementation**:

- Set bundle size budgets
- Monitor bundle size changes
- Identify large dependencies
- Test dynamic imports

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Maintains optimal application loading performance

## Accessibility Testing

### Automated A11y Testing

**Context**: Testing accessibility compliance
**Implementation**:

- Use jest-axe for automated accessibility testing
- Test keyboard navigation
- Validate screen reader compatibility
- Check color contrast compliance

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures application is usable by all users

### Manual A11y Testing

**Context**: Human validation of accessibility
**Implementation**:

- Test with screen readers
- Validate keyboard-only navigation
- Check focus management
- Test with users with disabilities

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Catches accessibility issues automated tools miss

## Test Organization Patterns

### Test File Structure

**Context**: Organizing test files and directories
**Implementation**:

- Co-locate tests with source files
- Use descriptive test file names
- Group related tests in directories
- Separate unit, integration, and e2e tests

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Makes tests easy to find and maintain

### Test Naming Conventions

**Context**: Naming tests and test suites
**Implementation**:

- Use descriptive test names
- Follow "should... when..." pattern
- Group tests with describe blocks
- Use consistent naming across project

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Makes test intent clear and results easy to understand

## Continuous Integration Testing

### CI Test Pipeline

**Context**: Running tests in CI/CD environment
**Implementation**:

- Run tests on every commit
- Separate fast and slow test suites
- Cache dependencies for speed
- Fail builds on test failures

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Catches issues early and maintains code quality

### Coverage Requirements

**Context**: Maintaining test coverage standards
**Implementation**:

- Set minimum coverage thresholds
- Monitor coverage trends
- Focus on critical code paths
- Use coverage reports for improvement

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures adequate testing without over-testing

## Coverage-Driven Development Patterns

### Strategic Coverage Improvement

**Context**: Systematically improving test coverage for maximum impact
**Implementation**:

1. **Baseline Measurement**: Establish current coverage baseline
2. **Gap Analysis**: Identify high-impact, low-coverage files
3. **Strategic Testing**: Target files with biggest coverage ROI
4. **Incremental Improvement**: Aim for 10-15% coverage increase per iteration
5. **Maintenance**: Regular coverage reviews and gap filling

**Example**:

```bash
# Measure current coverage
npx jest --coverage

# Identify high-impact files (services, utilities)
# Target files like lib/auth.ts, lib/email.ts first

# Systematic test implementation
# - Write comprehensive service tests (57 test cases for auth)
# - Focus on error paths and edge cases
# - Use coverage reports to identify remaining gaps

# Results achieved:
# lib/auth.ts: 99.31% statements, 87.09% branches (from ~25%)
# Overall: 86.7% statements, 79.49% branches (from ~60%)
```

**Rationale**: Maximizes coverage improvement impact with focused effort

### Error Path Testing Patterns

**Context**: Systematically testing error scenarios and edge cases
**Implementation**:

- Test all error branches systematically
- Cover different error message formats
- Test error recovery scenarios
- Validate error handling UI states

**Example**:

```typescript
// Comprehensive error testing pattern
describe('Error Handling', () => {
  it('should handle different error message formats', async () => {
    const testCases = [
      { error: new Error('Simple error'), expected: 'Simple error' },
      {
        error: new Error('Uncaught Error: Nested error'),
        expected: 'Nested error',
      },
      { error: { message: 'Object error' }, expected: 'Object error' },
      { error: 'String error', expected: 'String error' },
      { error: null, expected: 'An unexpected error occurred' },
    ];

    for (const { error, expected } of testCases) {
      mockConvex.mutation.mockRejectedValue(error);
      const result = await authService.register('test', 'email', 'pass');
      expect(result.error).toBe(expected);
    }
  });
});
```

**Rationale**: Ensures robust error handling across all scenarios

### Singleton and State Management Testing

**Context**: Testing singleton services and global state
**Implementation**:

- Reset singleton instances between tests
- Mock global dependencies properly
- Test state isolation between tests
- Handle async state updates correctly

**Example**:

```typescript
// Singleton testing pattern
describe('AuthService Singleton', () => {
  beforeEach(() => {
    // Critical: Reset singleton for test isolation
    (AuthService as any).instance = undefined;
    jest.clearAllMocks();

    // Mock global dependencies
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  it('should maintain singleton pattern', () => {
    const instance1 = AuthService.getInstance();
    const instance2 = AuthService.getInstance();
    expect(instance1).toBe(instance2);
  });
});
```

**Rationale**: Ensures proper test isolation and predictable state

## Anti-Patterns to Avoid

### Testing Implementation Details

- Don't test internal component state
- Focus on user-facing behavior
- Avoid testing private methods

### Overly Complex Test Setup

- Keep test setup simple and focused
- Avoid shared mutable state between tests
- Don't create overly elaborate test fixtures

### Ignoring Test Maintenance

- Update tests when requirements change
- Remove obsolete tests
- Refactor tests as code evolves

### Insufficient Error Testing

- Test error conditions and edge cases
- Validate error messages and handling
- Test recovery from failures

### Test Environment Issues

- **Wrong test runner**: Always use `npx jest --coverage`, not `bun test`
- **Mock hoisting problems**: Define mocks inline, not as variables
- **Global state leakage**: Reset singletons and global state between tests
- **Incomplete mocking**: Mock all external dependencies comprehensively

## Vector Storage Testing Patterns (Story 4.2)

### 1. UAT Testing Framework for Vector Operations

The Knowledge Ingestion Service introduces specialized testing patterns for vector storage and embedding operations. These patterns ensure comprehensive coverage of the hybrid Convex + Vectorize architecture.

#### **Automated UAT Script Structure**

```bash
# Location: ./scripts/test-uat-4.2.sh
# Usage: ./scripts/test-uat-4.2.sh [test-case|all]

# Test Categories:
# - AC1: Document Processing Action (tc1.1, tc1.2, tc1.3)
# - AC2: Text Content Processing (tc2.1, tc2.2)
# - AC3: Embedding Generation (tc3.1, tc3.2, tc3.3)
# - AC4: Vector Storage (tc4.2)
# - AC5: Document Seeding (tc5.1, tc5.2)
# - Additional: Vector Search (tc6.1, tc6.2)
```

#### **Environment-Aware Testing Pattern**

```bash
# Graceful handling of missing configuration
run_vector_search() {
    output=$(npx convex run knowledgeActions:queryVectorSimilarity "$json_payload" 2>&1)
    
    if echo "$output" | grep -q "Vectorize configuration incomplete"; then
        echo "⚠️  SKIP: Vectorize not configured - this test requires Cloudflare Vectorize setup"
        echo "   To enable: Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, VECTORIZE_DATABASE_ID"
    elif [ $exit_code -eq 0 ]; then
        echo "✅ PASS: Vector search succeeded"
    else
        echo "❌ FAIL: Vector search failed"
    fi
}
```

### 2. Multi-Service Testing Coordination

#### **Service Dependency Testing Matrix**

| Test Case | Convex | OpenAI API | Vectorize | Expected Behavior |
|-----------|--------|------------|-----------|-------------------|
| Basic Processing | ✅ | ❌ | ❌ | Graceful degradation, placeholder embeddings |
| With Embeddings | ✅ | ✅ | ❌ | Embeddings generated, no vector storage |
| Full Integration | ✅ | ✅ | ✅ | Complete vector storage and search |
| Partial Failure | ✅ | ✅ | ❌ (fails) | Document processing continues |

#### **Configuration Testing Pattern**

```typescript
// Test configuration validation
describe('Configuration Validation', () => {
  it('should handle missing OpenAI API key gracefully', async () => {
    const result = await ctx.runAction(api.knowledgeActions.addDocument, {
      content: 'Test content',
      source: 'test.md'
    });
    
    expect(result.status).toBe('completed');
    expect(result.chunksCreated).toBeGreaterThan(0);
    // Should not throw error even without OpenAI key
  });
  
  it('should handle missing Vectorize config gracefully', async () => {
    // Similar pattern for Vectorize configuration testing
  });
});
```

### 3. Vector Operation Testing Patterns

#### **Embedding Dimension Validation**

```typescript
describe('Embedding Generation', () => {
  it('should generate 1536-dimension embeddings', async () => {
    const chunks = chunkText('Sample content for testing embedding generation');
    const embeddings = await generateEmbeddingsForChunks(chunks, apiKey);
    
    embeddings.forEach(({ embedding }) => {
      if (embedding) {
        expect(embedding).toHaveLength(1536);
        expect(embedding.every(val => typeof val === 'number')).toBe(true);
      }
    });
  });
});
```

#### **Vector ID Constraint Testing**

```typescript
describe('Vector ID Generation', () => {
  it('should generate vector IDs under 64 bytes', async () => {
    const longContentHash = 'a'.repeat(64);
    const chunkIndex = 999;
    
    const shortHash = longContentHash.substring(0, 16);
    const vectorizeId = `${shortHash}_c${chunkIndex}`;
    
    expect(vectorizeId.length).toBeLessThanOrEqual(64);
    expect(vectorizeId).toMatch(/^[a-f0-9]{16}_c\d+$/);
  });
});
```

#### **Hybrid Storage Consistency Testing**

```typescript
describe('Hybrid Storage Consistency', () => {
  it('should maintain consistency between Convex and Vectorize', async () => {
    const result = await ctx.runAction(api.knowledgeActions.addDocument, {
      content: 'Test document for consistency verification',
      source: 'consistency-test.md'
    });
    
    // Verify Convex storage
    const convexChunks = await ctx.runQuery(api.knowledge.getChunksBySource, {
      sourceDocument: 'consistency-test.md'
    });
    
    expect(convexChunks).toHaveLength(result.chunksCreated);
    
    // Verify each chunk has corresponding vector reference
    convexChunks.forEach(chunk => {
      expect(chunk.vectorize_id).toMatch(/^[a-f0-9]{16}_c\d+$/);
      expect(chunk.vectorize_id.length).toBeLessThanOrEqual(64);
    });
  });
});
```

### 4. Performance Testing Patterns

#### **Large Document Processing**

```typescript
describe('Performance Testing', () => {
  it('should handle large documents efficiently', async () => {
    const largeContent = 'Lorem ipsum '.repeat(1000); // ~10KB content
    const startTime = Date.now();
    
    const result = await ctx.runAction(api.knowledgeActions.addDocument, {
      content: largeContent,
      source: 'large-test.md'
    });
    
    const processingTime = Date.now() - startTime;
    
    expect(result.status).toBe('completed');
    expect(result.chunksCreated).toBeGreaterThan(1);
    expect(processingTime).toBeLessThan(30000); // Under 30 seconds
  });
});
```

#### **Batch Operation Testing**

```typescript
describe('Batch Operations', () => {
  it('should efficiently process multiple documents', async () => {
    const documents = Array.from({ length: 10 }, (_, i) => ({
      content: `Test document ${i} with unique content for testing batch processing`,
      source: `batch-test-${i}.md`
    }));
    
    const startTime = Date.now();
    const results = await Promise.all(
      documents.map(doc => ctx.runAction(api.knowledgeActions.addDocument, doc))
    );
    const totalTime = Date.now() - startTime;
    
    expect(results.every(r => r.status === 'completed')).toBe(true);
    expect(totalTime / documents.length).toBeLessThan(5000); // Under 5s per document
  });
});
```

### 5. Error Handling Testing Patterns

#### **Service Failure Simulation**

```typescript
describe('Error Handling', () => {
  it('should handle OpenAI API failures gracefully', async () => {
    // Mock OpenAI API to return error
    const mockApiKey = 'invalid-key';
    
    const result = await ctx.runAction(api.knowledgeActions.addDocument, {
      content: 'Test content',
      source: 'error-test.md'
    });
    
    // Should complete even with API failure
    expect(result.status).toBe('completed');
    expect(result.chunksCreated).toBeGreaterThan(0);
  });
  
  it('should handle Vectorize API failures gracefully', async () => {
    // Similar pattern for Vectorize failure testing
  });
});
```

#### **Data Consistency Under Failure**

```typescript
describe('Failure Recovery', () => {
  it('should maintain data consistency during partial failures', async () => {
    // Test scenario where vector insertion fails but document processing continues
    const result = await ctx.runAction(api.knowledgeActions.addDocument, {
      content: 'Test content for failure scenario',
      source: 'failure-test.md'
    });
    
    // Document should be created even if vector insertion fails
    const document = await ctx.runQuery(api.knowledgeMutations.getDocumentByPath, {
      filePath: 'failure-test.md'
    });
    
    expect(document).toBeTruthy();
    expect(document.processing_status).toBe('completed');
  });
});
```

### 6. Integration Testing Patterns

#### **End-to-End Vector Search Testing**

```typescript
describe('Vector Search Integration', () => {
  beforeAll(async () => {
    // Seed test documents with known content
    await ctx.runAction(api.knowledgeActions.addDocument, {
      content: 'Machine learning algorithms for data analysis',
      source: 'ml-test.md'
    });
    
    await ctx.runAction(api.knowledgeActions.addDocument, {
      content: 'Cooking recipes for Italian cuisine',
      source: 'cooking-test.md'
    });
  });
  
  it('should return relevant results for similarity search', async () => {
    const results = await ctx.runAction(api.knowledgeActions.queryVectorSimilarity, {
      query: 'machine learning techniques',
      topK: 2,
      includeContent: true
    });
    
    expect(results.matches).toHaveLength(2);
    expect(results.matches[0].score).toBeGreaterThan(results.matches[1].score);
    
    // Should find ML document more relevant than cooking
    const mlResult = results.matches.find(m => 
      m.chunk?.source_document === 'ml-test.md'
    );
    expect(mlResult).toBeTruthy();
    expect(mlResult.score).toBeGreaterThan(0.5); // High relevance threshold
  });
});
```

### 7. Seeding Script Testing Patterns

#### **File Discovery Testing**

```typescript
describe('Document Seeding', () => {
  it('should discover appropriate files for processing', () => {
    const { findFilesToProcess } = require('../scripts/seed-knowledge.cjs');
    
    const docsFiles = findFilesToProcess(path.join(PROJECT_ROOT, 'docs'));
    const appsFiles = findFilesToProcess(path.join(PROJECT_ROOT, 'apps'));
    
    expect(docsFiles.length).toBeGreaterThan(50); // Should find substantial docs
    expect(appsFiles.length).toBeGreaterThan(50); // Should find substantial code
    
    // Verify file type filtering
    const allFiles = [...docsFiles, ...appsFiles];
    allFiles.forEach(file => {
      expect(['markdown', 'typescript', 'javascript', 'typescript-react', 'javascript-react'])
        .toContain(file.fileType);
    });
  });
});
```

### 8. Monitoring and Observability Testing

#### **Correlation ID Tracing**

```typescript
describe('Observability', () => {
  it('should maintain correlation IDs throughout processing', async () => {
    const result = await ctx.runAction(api.knowledgeActions.addDocument, {
      content: 'Test content for correlation tracking',
      source: 'correlation-test.md'
    });
    
    // Verify correlation ID exists in document record
    const document = await ctx.runQuery(api.knowledgeMutations.getDocumentByPath, {
      filePath: 'correlation-test.md'
    });
    
    expect(document.correlation_id).toBeTruthy();
    expect(document.correlation_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    
    // Verify correlation ID propagated to chunks
    const chunks = await ctx.runQuery(api.knowledge.getChunksBySource, {
      sourceDocument: 'correlation-test.md'
    });
    
    chunks.forEach(chunk => {
      expect(chunk.correlation_id).toBe(document.correlation_id);
    });
  });
});
```

These vector storage testing patterns ensure comprehensive coverage of the Knowledge Ingestion Service while accounting for the complexity of multi-service integration and the need for graceful degradation in various failure scenarios.

## Related Documentation

- [Test Strategy and Standards](../architecture/test-strategy-and-standards.md) - Testing strategy and coverage standards
- [Testing Infrastructure Lessons Learned](../lessons-learned/technology/testing-infrastructure-lessons-learned.md) - Implementation challenges and solutions
- [CI/CD Pipeline Setup](../technical-guides/cicd-pipeline-setup.md) - Pipeline testing configuration
- [Frontend Patterns](frontend-patterns.md) - Component testing integration
- [Backend Patterns](backend-patterns.md) - For API testing patterns
- [Development Workflow Patterns](development-workflow-patterns.md) - For test automation
