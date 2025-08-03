# Story 1: Deploy to Cloudflare with Automated CI/CD and Observability

## Status

Draft

## Story

**As a** developer,
**I want** to deploy our Next.js application to Cloudflare Pages with automated CI/CD pipelines and comprehensive observability,
**so that** I can have a production-ready deployment with monitoring, logging, and automated releases.

## Acceptance Criteria

1. **Cloudflare Pages Deployment**: The Next.js web application deploys successfully to Cloudflare Pages with GitHub integration
2. **Automated CI/CD Pipeline**: GitHub Actions automatically build and deploy on push to main branch
3. **Workers Deployment**: The log ingestion worker deploys to Cloudflare Workers with proper configuration
4. **Observability Integration**: Cloudflare Workers Logs and Analytics are configured and accessible
5. **Environment Management**: Production and staging environments are properly configured with secrets
6. **Monitoring Dashboard**: A dashboard exists to monitor deployment status and application health
7. **Rollback Capability**: Failed deployments can be rolled back automatically or manually

## Estimation & Planning

### Story Points

21

### Estimated Complexity

High

### Estimated Time

7-10 days

### Risk Level

High

## Tasks / Subtasks

- [ ] Task 1: Configure Cloudflare Pages Deployment (AC: 1)
  - [ ] Set up Cloudflare Pages project with GitHub integration
  - [ ] Configure build settings for Next.js static export
  - [ ] Verify deployment with @cloudflare/next-on-pages adapter
  - [ ] Test custom domain configuration and SSL certificates
  - [ ] Set up preview deployments for pull requests

- [ ] Task 2: Implement GitHub Actions CI/CD Pipeline (AC: 2)
  - [ ] Create comprehensive deployment workflow (.github/workflows/deploy.yml)
  - [ ] Configure build, test, and deployment stages
  - [ ] Implement environment-specific deployments (staging/production)
  - [ ] Add deployment status notifications and checks
  - [ ] Configure secrets and environment variables management

- [ ] Task 3: Deploy and Configure Cloudflare Workers (AC: 3)
  - [ ] Deploy log ingestion worker to Cloudflare Workers
  - [ ] Configure Durable Objects for rate limiting
  - [ ] Set up worker secrets (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
  - [ ] Implement worker observability settings
  - [ ] Test worker functionality in production environment

- [ ] Task 4: Enable Comprehensive Observability (AC: 4)
  - [ ] Configure Workers Logs with appropriate sampling rates
  - [ ] Set up Cloudflare Analytics for Pages and Workers
  - [ ] Implement real-time log monitoring and alerts
  - [ ] Create observability queries using Query Builder
  - [ ] Configure log export to external monitoring tools (optional)

- [ ] Task 5: Environment and Secrets Management (AC: 5)
  - [ ] Configure production environment variables
  - [ ] Set up Cloudflare Workers secrets management
  - [ ] Implement secure handling of API keys and tokens
  - [ ] Configure Convex environment for production
  - [ ] Set up domain-specific environment configurations

- [ ] Task 6: Create Monitoring and Health Dashboard (AC: 6)
  - [ ] Set up Cloudflare dashboard monitoring
  - [ ] Create custom analytics dashboards for application metrics
  - [ ] Implement health check endpoints for all services
  - [ ] Configure uptime monitoring and alerting
  - [ ] Create deployment status tracking interface

- [ ] Task 7: Implement Rollback and Recovery Procedures (AC: 7)
  - [ ] Configure automatic rollback triggers for failed deployments
  - [ ] Create manual rollback procedures and documentation
  - [ ] Test rollback scenarios for both Pages and Workers
  - [ ] Implement deployment validation and smoke tests
  - [ ] Create incident response procedures

- [ ] Task 8: Documentation and Automation Scripts
  - [ ] Create deployment runbook and troubleshooting guide
  - [ ] Implement deployment automation scripts using MCPs
  - [ ] Document environment setup and configuration
  - [ ] Create developer onboarding guide for deployments
  - [ ] Test all deployment procedures end-to-end

## Documentation Impact Assessment

**Architectural Patterns Established:**

- Cloudflare Pages + Workers multi-service deployment architecture
- GitHub Actions CI/CD pipeline with environment promotion
- Comprehensive observability and monitoring patterns
- Infrastructure as Code using Wrangler configuration
- Multi-environment deployment with secrets management
- Automated rollback and recovery procedures

**Documentation Updates Needed:**

- Add comprehensive deployment guide to `docs/technical-guides/`
- Update `docs/architecture/infrastructure-and-deployment.md` with Cloudflare patterns
- Create CI/CD pipeline documentation in `docs/patterns/`
- Document observability and monitoring setup procedures
- Add troubleshooting guide for common deployment issues
- Update environment management documentation

**Knowledge Capture:**

- Cloudflare Pages deployment best practices and configuration
- GitHub Actions workflow patterns for multi-service deployments
- Workers observability configuration and monitoring strategies
- Environment variable and secrets management patterns
- Rollback procedures and incident response protocols
- Performance optimization for Cloudflare edge deployment

**Examples to Create:**

- Complete GitHub Actions workflow templates
- Wrangler configuration examples for different environments
- Observability query examples for common monitoring scenarios
- Deployment script templates using Cloudflare MCPs
- Health check implementation examples
- Rollback automation script examples

## Dev Notes

### Technical Architecture

From existing project configuration:

- **Next.js 14.2.15** with @cloudflare/next-on-pages adapter for static export
- **Cloudflare Workers** for log ingestion with Durable Objects rate limiting
- **Turbo** monorepo with workspace-based build coordination
- **Bun** package manager with optimized build processes
- **TypeScript 5.4.x** with strict mode enforcement

### Current Infrastructure State

**Existing Configuration Analysis:**

From `/apps/web/package.json`:
- Pages build command: `@cloudflare/next-on-pages --outdir=dist`
- Deployment script: `wrangler pages deploy dist --project-name=starter-nextjs-convex-ai`
- Static export adapter already configured

From `/apps/workers/log-ingestion/wrangler.toml`:
- Worker name: `log-ingestion-worker`
- Durable Objects configured for rate limiting
- Environment-specific configuration (development/production)
- Missing secrets: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

From root `package.json`:
- Existing scripts: `pages:build`, `pages:deploy`, `worker:deploy`, `worker:deploy:production`
- CI monitoring scripts: `ci:status`, `ci:watch`, `ci:logs`
- Smart deployment: `push` script with CI integration

### Required Cloudflare Services Configuration

**Cloudflare Pages Requirements:**

```bash
# Project Configuration
Project Name: starter-nextjs-convex-ai
Framework: Next.js
Build Command: bun run build:pages
Output Directory: dist
Root Directory: apps/web
Node.js Version: 18.x
```

**Pages Environment Variables:**
```bash
NEXT_PUBLIC_CONVEX_URL=<production_convex_url>
NEXT_PUBLIC_BETTER_AUTH_URL=<production_auth_url>
NODE_VERSION=18
```

**Cloudflare Workers Configuration:**

From Workers observability documentation:
```toml
[observability]
enabled = true
head_sampling_rate = 0.01  # 1% sampling for production

[observability.logs]
invocation_logs = true
```

### GitHub Actions Workflow Structure

**Required Workflow Configuration:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run typecheck
      - run: bun run lint  
      - run: bun run test
      - run: bun run build

  deploy-worker:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: apps/workers/log-ingestion
          command: deploy --env production

  deploy-pages:
    needs: test  
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run build:pages
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: pages deploy apps/web/dist --project-name=starter-nextjs-convex-ai
```

### Required GitHub Secrets

**Repository Secrets Configuration:**
```bash
CLOUDFLARE_API_TOKEN=<api_token_with_zone_page_worker_permissions>
CLOUDFLARE_ACCOUNT_ID=<cloudflare_account_id>
UPSTASH_REDIS_REST_URL=<redis_url_for_worker>
UPSTASH_REDIS_REST_TOKEN=<redis_token_for_worker>
```

### Observability Configuration

**Workers Logs Setup:**

Based on Cloudflare documentation:
- Automatic log collection for all Workers
- 7-day retention period
- Query Builder for log analysis
- Real-time log monitoring via dashboard
- Integration with external tools via Logpush (optional)

**Required wrangler.toml Updates:**
```toml
[observability]
enabled = true
head_sampling_rate = 0.01

[observability.logs]
invocation_logs = true
```

**Analytics Configuration:**
- Enable Workers Analytics Engine for custom metrics
- Configure GraphQL Analytics API access
- Set up custom dashboards for deployment monitoring

### Deployment Automation with MCPs

**Cloudflare MCP Integration:**

Using `mcp__cloudflare-observability__*` tools:
- Query deployment status and logs
- Monitor worker performance metrics
- Automate observability configuration
- Generate deployment reports

**GitHub MCP Integration:**

Using `mcp__github__*` tools:
- Automate repository configuration
- Manage deployment secrets
- Create and update GitHub Actions workflows
- Monitor deployment status through GitHub API

### Environment-Specific Configuration

**Production Environment:**
```toml
[env.production]
name = "starter-nextjs-convex-ai-prod"
workers_dev = false

[env.production.vars]
ENVIRONMENT = "production"
```

**Staging Environment:**
```toml
[env.staging]  
name = "starter-nextjs-convex-ai-staging"
workers_dev = false

[env.staging.vars]
ENVIRONMENT = "staging"
```

### Health Checks and Monitoring

**Worker Health Check Endpoint:**
```typescript
// /health endpoint for monitoring
app.get('/health', () => {
  return new Response(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: WORKER_VERSION
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

**Pages Health Validation:**
- Custom health check page at `/api/health`
- Integration with Convex backend health
- Database connectivity verification
- External service dependency checks

### Rollback Procedures

**Automated Rollback Triggers:**
- Failed health checks post-deployment
- Error rate above threshold (>5% for 5 minutes)
- Critical performance degradation
- Manual trigger via GitHub Actions

**Manual Rollback Process:**
```bash
# Pages rollback to previous version
wrangler pages deployment list --project-name=starter-nextjs-convex-ai
wrangler pages deployment activate <previous_deployment_id>

# Worker rollback to previous version  
wrangler versions list
wrangler versions deploy <previous_version_id>
```

### Testing Requirements

**Deployment Testing Strategy:**
- Smoke tests post-deployment for all critical paths
- Health check validation across all services
- Integration tests between Pages and Workers
- Performance baseline verification
- Security scanning and vulnerability assessment

**Testing File Locations:**
- `tests/e2e/deployment/` - End-to-end deployment tests
- `tests/integration/cloudflare/` - Cloudflare-specific integration tests
- `scripts/deployment-tests/` - Automated deployment validation scripts

### Performance Considerations

**Cloudflare Optimization:**
- Enable Cloudflare CDN caching for static assets
- Configure proper cache headers for different content types
- Implement edge-side includes for dynamic content
- Optimize worker execution time and memory usage
- Configure geographic distribution and routing

### Security Considerations

**Deployment Security:**
- Secure secrets management using GitHub Secrets and Cloudflare Workers secrets
- Implement proper CORS configuration for cross-origin requests
- Configure CSP headers for XSS protection
- Enable HTTPS-only access with HSTS headers
- Implement rate limiting and DDoS protection

### Technical Constraints

**Cloudflare Limitations:**
- Pages: 20,000 files per deployment, 25MB max file size
- Workers: 1MB script size limit, 128MB memory limit
- Durable Objects: 128MB memory per instance
- Workers Logs: 7-day retention, 5 billion logs per day limit

**Build Constraints:**
- Next.js must use static export mode for Pages compatibility
- TypeScript compilation must complete without errors
- All tests must pass before deployment
- Build artifacts must be under size limits

## Change Log

| Date       | Version | Description                 | Author                              |
| ---------- | ------- | --------------------------- | ----------------------------------- |
| 2025-01-29 | 1.0     | Initial story draft created | BMad Agent (create-next-story task) |

## Dev Agent Record

### Agent Model Used

_To be populated during implementation_

### Debug Log References

_To be populated during implementation_

### Completion Notes List

_To be populated during implementation_

### File List

_To be populated during implementation_

## QA Results

_Quality assurance results will be documented here after implementation._