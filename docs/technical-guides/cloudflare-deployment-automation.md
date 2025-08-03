# Cloudflare Deployment Automation Guide

This guide covers the automated deployment setup for our Next.js application to Cloudflare Pages and Workers using GitHub Actions and MCP integrations.

## Overview

The deployment system includes:

- **Cloudflare Pages**: Hosts the Next.js frontend application
- **Cloudflare Workers**: Runs the log ingestion service with Durable Objects
- **GitHub Actions**: Automates testing, building, and deployment
- **Observability**: Comprehensive logging and monitoring

## Prerequisites

1. **Cloudflare Account**: Account ID `627e0c7ccbe735a4a7cabf91e377bbad`
2. **GitHub Repository**: `tonyoconnell/starter-nextjs-convex-ai`
3. **Wrangler CLI**: Installed and authenticated
4. **Environment Variables**: Configured in GitHub Secrets

## Quick Start

### 1. Run Automated Setup

```bash
# Make the script executable
chmod +x scripts/setup-cloudflare-deployment.js

# Run the automated setup
node scripts/setup-cloudflare-deployment.js
```

This script will:
- ✅ Verify prerequisites (Wrangler CLI, authentication)
- ✅ Create Cloudflare Pages project
- ✅ Deploy the log ingestion worker
- ✅ Configure observability settings
- ✅ Perform initial deployment and validation

### 2. Configure GitHub Secrets

Add these secrets to your GitHub repository at:
`https://github.com/tonyoconnell/starter-nextjs-convex-ai/settings/secrets/actions`

**Required Secrets:**

```bash
CLOUDFLARE_API_TOKEN=<your_api_token>
CLOUDFLARE_ACCOUNT_ID=627e0c7ccbe735a4a7cabf91e377bbad
UPSTASH_REDIS_REST_URL=<your_redis_url>
UPSTASH_REDIS_REST_TOKEN=<your_redis_token>
NEXT_PUBLIC_CONVEX_URL=<your_convex_deployment_url>
NEXT_PUBLIC_BETTER_AUTH_URL=<your_auth_url>
```

### 3. Trigger Deployment

```bash
# Push to main branch to trigger automated deployment
git add .
git commit -m "feat: enable automated Cloudflare deployment"
git push origin main
```

## GitHub Actions Workflow

The automated deployment workflow (`.github/workflows/deploy.yml`) includes:

### Testing Phase
- TypeScript compilation check
- ESLint validation
- Unit test execution
- Application build verification

### Deployment Phase (main branch only)
- **Worker Deployment**: Deploys to Cloudflare Workers with production environment
- **Pages Deployment**: Builds and deploys to Cloudflare Pages
- **Health Checks**: Validates both deployments are responding

### Post-Deployment
- Deployment health validation
- Success/failure notifications
- Automatic rollback on critical failures

## Project Structure

```
├── .github/workflows/
│   └── deploy.yml                    # GitHub Actions workflow
├── apps/
│   ├── web/                         # Next.js application
│   │   ├── dist/                    # Build output for Pages
│   │   └── package.json             # Pages build scripts
│   └── workers/
│       └── log-ingestion/           # Cloudflare Worker
│           ├── src/
│           └── wrangler.toml        # Worker configuration
├── scripts/
│   └── setup-cloudflare-deployment.js  # Automated setup script
└── docs/
    └── technical-guides/
        └── cloudflare-deployment-automation.md  # This file
```

## Environment Configuration

### Production Environment

**Cloudflare Pages Settings:**
- Project Name: `starter-nextjs-convex-ai`
- Build Command: `bun run build:pages`
- Output Directory: `dist`
- Root Directory: `apps/web`
- Node.js Version: `18.x`

**Cloudflare Worker Settings:**
- Worker Name: `log-ingestion-worker`
- Environment: `production`
- Durable Objects: Rate limiting enabled
- Observability: 1% sampling rate

### Environment Variables

**Pages Environment:**
```bash
NODE_VERSION=18
NEXT_PUBLIC_CONVEX_URL=<production_url>
NEXT_PUBLIC_BETTER_AUTH_URL=<auth_url>
```

**Worker Secrets:**
```bash
UPSTASH_REDIS_REST_URL=<redis_url>
UPSTASH_REDIS_REST_TOKEN=<redis_token>
ENVIRONMENT=production
```

## Observability and Monitoring

### Cloudflare Workers Logs

Access logs at: `https://dash.cloudflare.com/627e0c7ccbe735a4a7cabf91e377bbad/workers-and-pages/observability`

**Configuration:**
```toml
[observability]
enabled = true
head_sampling_rate = 0.01  # 1% sampling

[observability.logs]
invocation_logs = true
```

### Real-time Monitoring

```bash
# Monitor worker logs in real-time
wrangler tail log-ingestion-worker --env production

# Query observability data
wrangler pages deployment list --project-name=starter-nextjs-convex-ai
```

### Health Check Endpoints

- **Pages**: `https://starter-nextjs-convex-ai.pages.dev/api/health`
- **Worker**: `https://log-ingestion-worker.tonyoconnell.workers.dev/health`

## MCP Integration

### Cloudflare Observability MCP

Query deployment status and logs:

```javascript
// Query worker logs
await mcp__cloudflare_observability__query_worker_observability({
  query: {
    view: "events",
    parameters: {
      filters: [
        { key: "$metadata.service", operation: "eq", type: "string", value: "log-ingestion-worker" }
      ]
    },
    timeframe: { reference: "2025-01-29T12:00:00Z", offset: "-1h" }
  }
});

// List workers
await mcp__cloudflare_observability__workers_list();
```

### GitHub MCP

Automate repository management:

```javascript
// Create/update workflow files
await mcp__github__create_or_update_file({
  owner: "tonyoconnell",
  repo: "starter-nextjs-convex-ai",
  path: ".github/workflows/deploy.yml",
  content: workflowContent,
  message: "Update deployment workflow"
});
```

## Troubleshooting

### Common Issues

**1. Deployment Fails - Authentication Error**
```bash
# Check Wrangler authentication
wrangler whoami

# Re-authenticate if needed
wrangler login
```

**2. Pages Build Fails**
```bash
# Test build locally
cd apps/web
bun run build:pages

# Check build output
ls -la dist/
```

**3. Worker Deployment Fails**
```bash
# Check worker configuration
cd apps/workers/log-ingestion
wrangler deploy --dry-run --env production

# Validate wrangler.toml
wrangler validate
```

**4. Health Checks Fail**
```bash
# Test endpoints manually
curl -v https://starter-nextjs-convex-ai.pages.dev/api/health
curl -v https://log-ingestion-worker.tonyoconnell.workers.dev/health
```

### Debug Commands

```bash
# View recent deployments
wrangler pages deployment list --project-name=starter-nextjs-convex-ai

# Check worker versions
wrangler versions list --name=log-ingestion-worker

# View GitHub Actions logs
gh run list --repo=tonyoconnell/starter-nextjs-convex-ai
gh run view <run-id> --log
```

### Rollback Procedures

**Pages Rollback:**
```bash
# List deployments
wrangler pages deployment list --project-name=starter-nextjs-convex-ai

# Activate previous deployment
wrangler pages deployment activate <deployment-id>
```

**Worker Rollback:**
```bash
# List versions
wrangler versions list --name=log-ingestion-worker

# Deploy previous version
wrangler versions deploy <version-id> --name=log-ingestion-worker
```

## Performance Optimization

### Cloudflare Edge Optimization

1. **Caching Strategy**
   - Static assets cached at edge for 30 days
   - API responses cached for appropriate duration
   - Cache invalidation on deployment

2. **Geographic Distribution**
   - Global CDN with 200+ edge locations
   - Automatic routing to nearest datacenter
   - Worker execution at edge for low latency

3. **Build Optimization**
   - Next.js static export for optimal performance
   - Tree shaking and code splitting enabled
   - Bun for fast dependency resolution

## Security Considerations

### Deployment Security

1. **Secrets Management**
   - GitHub Secrets for sensitive configuration
   - Cloudflare Workers Secrets for runtime values
   - No hardcoded credentials in code

2. **Access Control**
   - Least-privilege API tokens
   - Branch protection rules
   - Required status checks

3. **Content Security**
   - HTTPS-only deployment
   - CSP headers configured
   - CORS properly configured

## Monitoring and Alerts

### Key Metrics

- Deployment success rate
- Page load times
- Worker execution time
- Error rates
- Health check status

### Alert Configuration

Set up alerts for:
- Deployment failures
- Health check failures
- High error rates (>5%)
- Performance degradation

## Next Steps

1. **Custom Domain Setup**
   - Configure custom domain for Pages
   - SSL certificate management
   - DNS configuration

2. **Advanced Observability**
   - Custom dashboards
   - External monitoring integration
   - Performance metrics tracking

3. **Multi-Environment Setup**
   - Staging environment configuration
   - Preview deployments for PRs
   - Environment promotion workflow

## Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)