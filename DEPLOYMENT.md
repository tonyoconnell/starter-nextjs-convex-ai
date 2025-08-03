# Three-Service Deployment Guide

This repository deploys a comprehensive three-service stack:

## 🏗️ Architecture Overview

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│                     │    │                     │    │                     │
│   Convex Backend    │◄───┤  Next.js Frontend   │◄───┤   Log Ingestion     │
│                     │    │                     │    │     Worker          │
│  Real-time DB       │    │  Cloudflare Pages   │    │  Cloudflare Worker  │
│  Server Functions   │    │  Static Frontend    │    │  Log Processing     │
│                     │    │                     │    │                     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

### Service Responsibilities

1. **Convex Backend** (`apps/convex/`)
   - Real-time database with subscriptions
   - Server-side functions and mutations
   - User authentication and sessions
   - Data validation and business logic

2. **Next.js Frontend** (`apps/web/`)
   - Static site deployed to Cloudflare Pages
   - React components and UI logic
   - Client-side routing and navigation
   - Consumes Convex backend APIs

3. **Log Ingestion Worker** (`apps/workers/log-ingestion/`)
   - Processes and stores application logs
   - Rate limiting with Durable Objects
   - Redis-based log storage
   - Health monitoring endpoints

## 🚀 Quick Deployment

### Prerequisites

- **Node.js 18+** and **Bun 1.1+**
- **Wrangler CLI**: `npm install -g wrangler`
- **Convex CLI**: `npm install -g convex`
- **GitHub repository** with Actions enabled
- **Cloudflare account** with Workers/Pages access

### 1. Automated Setup

```bash
# Run the automated deployment setup
node scripts/setup-cloudflare-deployment.js
```

This script will:
- ✅ Deploy Convex backend to production
- ✅ Deploy log ingestion worker to Cloudflare Workers  
- ✅ Create Cloudflare Pages project
- ✅ Configure observability settings
- ✅ Validate all deployments

### 2. Configure GitHub Secrets

Add these secrets at: `Settings → Secrets and variables → Actions`

```bash
CLOUDFLARE_API_TOKEN=<your_cloudflare_api_token>
CLOUDFLARE_ACCOUNT_ID=627e0c7ccbe735a4a7cabf91e377bbad
CONVEX_DEPLOY_KEY=<your_convex_deploy_key>
UPSTASH_REDIS_REST_URL=<your_redis_url>
UPSTASH_REDIS_REST_TOKEN=<your_redis_token>
NEXT_PUBLIC_CONVEX_URL=<your_convex_production_url>
NEXT_PUBLIC_BETTER_AUTH_URL=<your_auth_url>
```

### 3. Deploy via GitHub Actions

```bash
git add .
git commit -m "Enable automated three-service deployment"
git push origin main
```

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will:
1. Run tests across all services
2. Deploy Convex backend first
3. Deploy log ingestion worker
4. Build and deploy frontend to Pages
5. Run end-to-end health checks

## 📊 Monitoring & Observability

### Service URLs

- **Convex Dashboard**: https://dashboard.convex.dev
- **Frontend**: https://starter-nextjs-convex-ai.pages.dev
- **Log Worker**: https://log-ingestion-worker.tonyoconnell.workers.dev
- **Cloudflare Dashboard**: https://dash.cloudflare.com/627e0c7ccbe735a4a7cabf91e377bbad

### Health Check Endpoints

```bash
# Frontend health
curl https://starter-nextjs-convex-ai.pages.dev/api/health

# Log worker health  
curl https://log-ingestion-worker.tonyoconnell.workers.dev/health

# Convex backend (via API)
# See Convex dashboard for backend health
```

### Real-time Monitoring

```bash
# Monitor worker logs
wrangler tail log-ingestion-worker --env production

# View recent deployments
wrangler pages deployment list --project-name=starter-nextjs-convex-ai

# Check Convex functions
npx convex function list --prod
```

## 🛠️ Development Workflow

### Local Development

```bash
# Start all services locally
bun dev              # Starts Next.js dev server
bun convex:dev       # Starts Convex development backend
bun worker:dev       # Starts worker development server
```

### Testing

```bash
# Run all tests
bun test

# Test specific services
bun test:web         # Frontend tests
bun test:convex      # Backend tests
bun worker:test      # Worker tests
```

### Build Verification

```bash
# Build all services
bun build

# Build for production deployment
bun build:pages      # Frontend for Cloudflare Pages
```

## 🔧 Manual Deployment Commands

If you need to deploy services individually:

### Convex Backend

```bash
cd apps/convex
npx convex deploy --prod
```

### Log Ingestion Worker

```bash
cd apps/workers/log-ingestion
wrangler deploy --env production
```

### Frontend to Pages

```bash
cd apps/web
bun run build:pages
wrangler pages deploy dist --project-name=starter-nextjs-convex-ai
```

## 🚨 Troubleshooting

### Common Issues

**Deployment fails with authentication errors:**
```bash
# Re-authenticate services
wrangler login
npx convex login
```

**Frontend build fails:**
```bash
# Check environment variables
cd apps/web
bun run build:debug

# Verify Pages configuration
cat package.json | grep pages
```

**Worker deployment fails:**
```bash
# Test worker locally
cd apps/workers/log-ingestion
bun run dev

# Validate configuration
wrangler validate
```

**Convex deployment fails:**
```bash
# Check Convex configuration
cd apps/convex
npx convex env list

# Test function deployments
npx convex function list
```

### Service Dependencies

The services must be deployed in this order:
1. **Convex Backend** (provides database and APIs)
2. **Log Worker** (independent service for logging)
3. **Frontend** (consumes backend APIs)

### Rollback Procedures

**Frontend rollback:**
```bash
wrangler pages deployment list --project-name=starter-nextjs-convex-ai
wrangler pages deployment activate <previous-deployment-id>
```

**Worker rollback:**
```bash
wrangler versions list --name=log-ingestion-worker
wrangler versions deploy <previous-version-id>
```

**Convex rollback:**
```bash
# Convex maintains version history in dashboard
# Use Convex dashboard to rollback to previous deployment
```

## 📋 Environment Configuration

### Production Environment Variables

**Cloudflare Pages:**
- `NEXT_PUBLIC_CONVEX_URL`: Production Convex deployment URL
- `NEXT_PUBLIC_BETTER_AUTH_URL`: Authentication service URL
- `NODE_VERSION`: 18

**Cloudflare Worker:**
- `UPSTASH_REDIS_REST_URL`: Redis connection URL
- `UPSTASH_REDIS_REST_TOKEN`: Redis authentication token
- `ENVIRONMENT`: production

**Convex Backend:**
- Configured via Convex dashboard
- Environment variables set through `npx convex env set`

### Development vs Production

- **Development**: All services run locally with hot reload
- **Production**: Services deployed to their respective cloud platforms
- **Staging**: Can be configured using environment-specific deployments

## 🔒 Security Considerations

- All secrets managed through GitHub Secrets and platform-specific secret stores
- HTTPS-only deployment with automatic SSL certificates
- CORS properly configured for cross-origin requests
- Rate limiting implemented in log ingestion worker
- Authentication handled by Convex + BetterAuth integration

## 📈 Performance Optimization

- **Frontend**: Static site generation for optimal loading
- **Backend**: Real-time subscriptions for efficient data sync
- **Worker**: Edge deployment for low-latency log processing
- **CDN**: Global distribution via Cloudflare edge network

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Test locally: `bun test && bun build`
3. Push changes: `git push origin feature/my-feature`
4. Create pull request (triggers preview deployment)
5. Merge to main (triggers production deployment)

---

**Need help?** Check the [comprehensive deployment guide](docs/technical-guides/cloudflare-deployment-automation.md) or create an issue.