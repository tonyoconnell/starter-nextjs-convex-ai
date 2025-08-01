# Setup Verification Checklist

## Overview

This comprehensive checklist ensures that all components of your new repository are properly configured and working together. Follow this systematic verification process after completing the initial setup to confirm everything is functioning correctly.

## Pre-Verification Requirements

Before starting verification, ensure you have completed:

- [ ] **[Environment Sync Workflow](./technical-guides/environment-sync-workflow.md)** - Environment variables configured
- [ ] **[GitHub OAuth Setup](./technical-guides/github-oauth-setup.md)** - GitHub authentication configured
- [ ] **[LLM API Setup](./technical-guides/llm-api-setup.md)** - AI services configured
- [ ] **[Cloudflare Pages Setup](./technical-guides/cloudflare-pages-setup.md)** - Deployment configured
- [ ] **[CI/CD Pipeline Setup](./technical-guides/cicd-pipeline-setup.md)** - GitHub Actions configured

## Phase 1: Core Infrastructure Verification

### 1.1 Environment System Verification

**Check Source File Exists**:

```bash
ls -la .env.source-of-truth.local
```

- [ ] File exists and is not committed to git
- [ ] File contains your actual service credentials (not example values)
- [ ] File follows proper table format with pipe delimiters

**Test Environment Sync**:

```bash
bun run sync-env --dry-run
```

- [ ] Command runs without errors
- [ ] Shows expected environment variables
- [ ] No security warnings about public variables containing secrets

**Verify Generated Files**:

```bash
ls -la apps/web/.env.local apps/convex/.env.local
```

- [ ] Both environment files exist
- [ ] Files contain "DO NOT EDIT MANUALLY" warning
- [ ] Variables are properly distributed between Next.js and Convex

### 1.2 Package Scripts Verification

**Test Core Development Scripts**:

```bash
# Verify all scripts are available
bun run --help | grep -E "(dev|build|lint|test|typecheck)"
```

- [ ] All core scripts are listed and available
- [ ] No missing package.json script definitions

**Test Script Execution**:

```bash
# Test linting (should pass)
bun run lint

# Test type checking (should pass)
bun run typecheck

# Test build (should complete successfully)
bun build
```

- [ ] Linting passes with no errors
- [ ] TypeScript compilation succeeds
- [ ] Production build completes successfully

### 1.3 Convex Backend Verification

**Test Convex Connection**:

```bash
cd apps/convex && bunx convex dev
```

- [ ] Convex development server starts successfully
- [ ] No authentication errors
- [ ] Dashboard URL is accessible
- [ ] Functions deploy without errors

**Verify Environment Sync to Convex**:

```bash
cd apps/convex && bunx convex env list
```

- [ ] Environment variables are present in Convex
- [ ] Values match your source file
- [ ] No missing required variables

## Phase 2: Authentication Services Verification

### 2.1 GitHub OAuth Verification

**Check OAuth App Configuration**:

- [ ] GitHub OAuth app exists in your GitHub Developer Settings
- [ ] Both `localhost:3000` and `localhost:3100` callback URLs are configured
- [ ] Client ID and secret are in your environment source file

**Test Authentication Flow**:

```bash
# Start development server
PORT=3000 bun dev
```

**In Browser**:

1. Navigate to `http://localhost:3000/login`
2. Click "Continue with GitHub"
3. Complete OAuth flow
4. Verify successful authentication

- [ ] OAuth redirect works correctly
- [ ] User is redirected back to application
- [ ] User information is available in application
- [ ] No console errors during authentication

### 2.2 Google OAuth Verification (if configured)

**Check Google OAuth Configuration**:

- [ ] Google Cloud Project exists
- [ ] OAuth consent screen is configured
- [ ] OAuth 2.0 client exists with correct redirect URIs
- [ ] Client ID and secret are in environment source file

**Test Authentication Flow**:

1. Navigate to `http://localhost:3000/login`
2. Click "Continue with Google"
3. Complete OAuth flow
4. Verify successful authentication

- [ ] Google OAuth redirect works correctly
- [ ] User is redirected back to application
- [ ] User profile information is available
- [ ] No console errors during authentication

### 2.3 Authentication System Integration

**Test User Management**:

```bash
# Grant LLM access to test user
./scripts/grant-llm-access.sh your-test@example.com
```

- [ ] Script runs without errors
- [ ] User gains appropriate permissions
- [ ] Convex functions execute successfully

## Phase 3: AI Services Verification

### 3.1 LLM API Configuration

**Verify API Keys**:

```bash
# Check environment variables are set
cat apps/convex/.env.local | grep -E "(OPENAI|OPENROUTER|LLM)"
```

- [ ] API keys are present and not example values
- [ ] Model names are correctly formatted
- [ ] Fallback model is configured

**Test API Connectivity**:

**For OpenRouter**:

```bash
curl -X POST "https://openrouter.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_OPENROUTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-4o-mini","messages":[{"role":"user","content":"Hello"}]}'
```

**For OpenAI**:

```bash
curl -X POST "https://api.openai.com/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_OPENAI_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Hello"}]}'
```

- [ ] API responds successfully
- [ ] No authentication errors
- [ ] Response contains expected content

### 3.2 Chat Interface Testing

**Test Chat Functionality**:

1. Navigate to chat interface in your application
2. Send test message: "Hello, can you help me test the system?"
3. Wait for response

- [ ] Chat interface loads without errors
- [ ] Message sends successfully
- [ ] AI response is received
- [ ] Response appears in chat interface
- [ ] No console errors during chat interaction

**Test Fallback Behavior**:

1. Temporarily set invalid primary model in environment
2. Send chat message
3. Verify fallback model is used
4. Restore correct configuration

- [ ] Fallback model activates when primary fails
- [ ] User receives response (possibly slower)
- [ ] Error is logged but not exposed to user

## Phase 4: Deployment & CI/CD Verification

### 4.1 Local Development Verification

**Test Multi-Port Development**:

```bash
# Terminal 1: Human development
PORT=3000 bun dev

# Terminal 2: AI development
PORT=3100 bun dev
```

- [ ] Both servers start on correct ports
- [ ] No port conflicts
- [ ] Both interfaces are accessible
- [ ] Authentication works on both ports

### 4.2 Production Build Verification

**Test Production Build**:

```bash
# Clean previous builds
bun clean

# Build for production
bun build

# Build for Cloudflare Pages
cd apps/web && bun run build:pages
```

- [ ] All applications build successfully
- [ ] No TypeScript compilation errors
- [ ] Cloudflare Pages build completes
- [ ] Static files generated in correct location

### 4.3 CI/CD Pipeline Verification

**Check GitHub Actions Configuration**:

- [ ] Workflow file exists: `.github/workflows/ci.yml`
- [ ] All required secrets are set in GitHub repository settings
- [ ] Workflow has necessary permissions

**Test CI Pipeline**:

```bash
# Create test commit
echo "# CI/CD Test - $(date)" >> README.md
git add README.md
git commit -m "test: verify CI/CD pipeline"

# Push and monitor
bun run push
```

- [ ] Smart push validation passes (lint, typecheck, build)
- [ ] Push to GitHub succeeds
- [ ] GitHub Actions workflow triggers
- [ ] All CI jobs pass (lint, test, build, deploy)
- [ ] Deployment completes successfully

**Monitor CI Status**:

```bash
# Check pipeline status
bun run ci:status

# Watch pipeline execution
bun run ci:watch
```

- [ ] CI status commands work correctly
- [ ] Pipeline completes successfully
- [ ] Deployment is accessible at Cloudflare Pages URL

## Phase 5: Application Integration Testing

### 5.1 End-to-End User Flow

**Complete User Journey**:

1. Visit deployed application URL
2. Register/login with GitHub OAuth
3. Access authenticated features
4. Use chat interface with AI
5. Test any other core features

- [ ] Registration/login works in production
- [ ] All authenticated features accessible
- [ ] AI chat works in production environment
- [ ] No critical functionality broken
- [ ] Performance is acceptable

### 5.2 Error Handling Verification

**Test Error Scenarios**:

1. Try invalid authentication
2. Send message when LLM API is down
3. Access protected routes without authentication

- [ ] Authentication errors handled gracefully
- [ ] API errors don't crash application
- [ ] User receives appropriate error messages
- [ ] Application continues to function after errors

### 5.3 Cost Management Verification

**Check Cost Controls**:

```bash
# Run log cleanup
./scripts/cleanup-logs.sh

# Check Convex usage
bunx convex run monitoring:usage
```

- [ ] Log cleanup runs successfully
- [ ] Convex usage is within expected limits
- [ ] API spending is within configured limits
- [ ] Cost monitoring alerts are working

## Phase 6: Security & Performance Verification

### 6.1 Security Verification

**Environment Security**:

- [ ] No secrets committed to git repository
- [ ] Environment files are in `.gitignore`
- [ ] API keys have appropriate scope limitations
- [ ] OAuth redirect URIs are correctly configured

**Application Security**:

- [ ] Authentication required for protected routes
- [ ] API endpoints properly secured
- [ ] No sensitive data exposed in client-side code
- [ ] HTTPS used for all production traffic

### 6.2 Performance Verification

**Load Time Testing**:

- [ ] Initial page load < 3 seconds
- [ ] Chat responses < 10 seconds
- [ ] Authentication flow < 5 seconds
- [ ] No memory leaks during extended use

**Resource Usage**:

- [ ] Convex usage under monthly limits
- [ ] LLM API costs reasonable for usage
- [ ] Cloudflare bandwidth within free tier
- [ ] No excessive error rates in logs

## Troubleshooting Common Issues

### Environment Issues

**Symptoms**: Environment variables not loading, sync failures
**Solutions**:

```bash
# Check source file format
head -5 .env.source-of-truth.local

# Verify sync process
bun run sync-env --dry-run --verbose

# Check generated files
ls -la apps/*/.env.local
```

### Authentication Issues

**Symptoms**: OAuth redirects fail, authentication errors
**Solutions**:

1. Verify callback URLs in OAuth app settings
2. Check client ID/secret in environment
3. Test API connectivity with curl commands
4. Review browser console for detailed errors

### Deployment Issues

**Symptoms**: Build failures, deployment errors, site not accessible
**Solutions**:

1. Check GitHub Actions logs for specific errors
2. Verify Cloudflare Pages configuration
3. Test production build locally first
4. Check environment variables in deployment platform

### AI Integration Issues

**Symptoms**: Chat not working, API errors, no responses
**Solutions**:

1. Test API keys with direct curl commands
2. Check API usage limits and billing
3. Verify model names are correctly formatted
4. Check network connectivity and firewall rules

## Completion Checklist

Mark these items complete only when all verification steps pass:

- [ ] **Phase 1**: Core infrastructure verified
- [ ] **Phase 2**: Authentication services verified
- [ ] **Phase 3**: AI services verified
- [ ] **Phase 4**: Deployment & CI/CD verified
- [ ] **Phase 5**: Application integration tested
- [ ] **Phase 6**: Security & performance verified

## Post-Verification Actions

Once verification is complete:

1. **Document any deviations** from standard setup
2. **Create team onboarding notes** with environment-specific details
3. **Schedule regular health checks** using this checklist
4. **Set up monitoring alerts** for critical services
5. **Plan regular maintenance** (monthly log cleanup, quarterly security review)

## Related Documentation

- **[Technical Guides Index](./technical-guides/index.md)** - All setup guides referenced
- **[Scripts and Commands Reference](./technical-guides/scripts-and-commands-reference.md)** - Commands used in verification
- **[Development Guide](./development-guide.md)** - Development workflow
- **[CI Debugging Methodology](./technical-guides/ci-debugging-methodology.md)** - Troubleshooting CI issues

---

**Purpose**: Systematic verification of new repository setup  
**Usage**: Run after completing initial setup, before production deployment  
**Frequency**: Initial setup, major configuration changes, quarterly health checks
