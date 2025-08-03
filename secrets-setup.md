# GitHub Secrets Setup Guide

## Required Secrets for Automated Deployment

Add these to: https://github.com/tonyoconnell/starter-nextjs-convex-ai/settings/secrets/actions

### Cloudflare Configuration ✅
```
CLOUDFLARE_ACCOUNT_ID=627e0c7ccbe735a4a7cabf91e377bbad
CLOUDFLARE_API_TOKEN=2751f1e8bdbc3cf9481e0cff345605c9bd3b9
```

### Convex Configuration (Get from Dashboard)
```
CONVEX_DEPLOY_KEY=prod:your_production_deploy_key_here
NEXT_PUBLIC_CONVEX_URL=https://woozy-fly-898.convex.cloud
```

### Optional: Redis Configuration (for enhanced logging)
```
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here
```

### Authentication Configuration  
```
NEXT_PUBLIC_BETTER_AUTH_URL=https://starter-nextjs-convex-ai.pages.dev
```

## Quick Deploy Commands

Once secrets are set:

```bash
# Run automated setup
node scripts/setup-cloudflare-deployment.js

# Or deploy manually
npm run deploy
```

## Service URLs After Deployment

- **Frontend**: https://starter-nextjs-convex-ai.pages.dev
- **Log Worker**: https://log-ingestion-worker.tonyoconnell.workers.dev  
- **Convex Backend**: https://dashboard.convex.dev/t/oneie/mono-6ae1c