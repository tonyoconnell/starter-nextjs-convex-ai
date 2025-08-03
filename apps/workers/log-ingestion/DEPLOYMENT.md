# Cloudflare Worker Deployment Guide

This guide covers deploying the log ingestion worker with all required environment variables.

## Prerequisites

1. **Cloudflare Account**: Ensure you have a Cloudflare account and Workers enabled
2. **Wrangler CLI**: Installed and authenticated (`npx wrangler login`)
3. **Environment Variables**: Redis credentials and other required variables

## Environment Variables

### Required Variables

| Variable | Description | Source |
|----------|-------------|---------|
| `UPSTASH_REDIS_REST_URL` | Redis REST endpoint | `https://content-dane-8053.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Redis authentication token | Set via secrets |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | OpenRouter API key for LLM features | - |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | Rate limit per minute | 100 (dev), 500 (prod) |
| `RATE_LIMIT_BURST_SIZE` | Rate limit burst size | 20 (dev), 50 (prod) |
| `LOG_LEVEL` | Logging level | debug (dev), info (prod) |

## Deployment Methods

### Method 1: Automated Deployment (Recommended)

From project root:

```bash
# Deploy to production
bun run worker:deploy

# Deploy to development
bun run worker:deploy:dev

# Set up secrets only
bun run worker:secrets
```

### Method 2: Manual Deployment

1. **Navigate to worker directory:**
   ```bash
   cd apps/workers/log-ingestion
   ```

2. **Set up environment variables:**
   ```bash
   # Copy and edit environment file
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

3. **Set secrets:**
   ```bash
   # Run setup script
   bun run setup:secrets
   
   # Or manually set secrets
   echo "YOUR_REDIS_TOKEN" | npx wrangler secret put UPSTASH_REDIS_REST_TOKEN --env production
   ```

4. **Deploy:**
   ```bash
   # Production deployment
   bun run deploy
   
   # Development deployment
   bun run deploy:dev
   ```

## Environment Configuration

### Development Environment

```toml
[env.development]
workers_dev = true

[env.development.vars]
ENVIRONMENT = "development"
UPSTASH_REDIS_REST_URL = "https://content-dane-8053.upstash.io"
RATE_LIMIT_REQUESTS_PER_MINUTE = "100"
RATE_LIMIT_BURST_SIZE = "20"
LOG_LEVEL = "debug"
```

### Production Environment

```toml
[env.production]
workers_dev = false

[env.production.vars]
ENVIRONMENT = "production"
UPSTASH_REDIS_REST_URL = "https://content-dane-8053.upstash.io"
RATE_LIMIT_REQUESTS_PER_MINUTE = "500"
RATE_LIMIT_BURST_SIZE = "50"
LOG_LEVEL = "info"
```

## Available Commands

### From Project Root

```bash
# Deployment
bun run worker:deploy          # Deploy to production
bun run worker:deploy:dev      # Deploy to development  
bun run worker:deploy:production # Deploy to production (explicit)

# Development
bun run worker:dev             # Start local development
bun run worker:test            # Run tests

# Secrets Management
bun run worker:secrets         # Set up all secrets
```

### From Worker Directory

```bash
# Deployment
bun run deploy                 # Deploy to production
bun run deploy:dev            # Deploy to development
bun run deploy:production     # Deploy to production

# Development
bun run dev                   # Start local development
bun run build                 # Build worker

# Secrets Management  
bun run setup:secrets         # Set up secrets
bun run secrets:list          # List all secrets
bun run secrets:list:dev      # List development secrets
bun run secrets:list:prod     # List production secrets

# Code Quality
bun run typecheck            # TypeScript validation
bun run format              # Format code
```

## Verification

### 1. Check Deployment Status

```bash
# List deployments
npx wrangler deployments list

# View worker details
npx wrangler whoami
```

### 2. Test Endpoints

```bash
# Health check
curl https://log-ingestion-worker.oneie.workers.dev/health

# Basic endpoint
curl https://log-ingestion-worker.oneie.workers.dev/

# Test log ingestion
curl -X POST https://log-ingestion-worker.oneie.workers.dev/log \
  -H "Content-Type: application/json" \
  -d '{"trace_id": "test-123", "message": "test log", "level": "info", "system": "test"}'
```

### 3. Monitor Logs

```bash
# Tail production logs
npx wrangler tail --env production

# Tail development logs
npx wrangler tail --env development
```

## Troubleshooting

### Common Issues

1. **Authentication Error**
   ```bash
   npx wrangler login
   ```

2. **Missing Secrets**
   ```bash
   bun run secrets:list:prod
   bun run setup:secrets
   ```

3. **Redis Connection Issues**
   - Verify `UPSTASH_REDIS_REST_URL` is correct
   - Ensure `UPSTASH_REDIS_REST_TOKEN` is valid
   - Check Redis instance is active

4. **Rate Limiting Issues**
   - Adjust `RATE_LIMIT_REQUESTS_PER_MINUTE` in wrangler.toml
   - Monitor Durable Object usage

### Debug Commands

```bash
# Check worker configuration
npx wrangler status

# View environment variables
npx wrangler secret:list --env production

# Test locally with production config
npx wrangler dev --env production --local
```

## Security Notes

- **Never commit `.env.local`** - it contains sensitive credentials
- **Use secrets for sensitive data** - tokens, API keys, passwords
- **Separate dev/prod environments** - different Redis instances recommended
- **Monitor usage** - set up Cloudflare analytics and alerts

## Production Checklist

- [ ] Redis instance is configured and accessible
- [ ] All secrets are set via `wrangler secret put`
- [ ] Environment variables are configured in wrangler.toml
- [ ] Rate limits are appropriate for production load
- [ ] CORS origins are configured correctly
- [ ] Health check endpoint responds successfully
- [ ] Monitoring and alerting are set up
- [ ] Backup and recovery procedures are documented