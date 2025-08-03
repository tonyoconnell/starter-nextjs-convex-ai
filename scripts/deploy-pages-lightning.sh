#!/bin/bash

# Lightning-Fast Cloudflare Pages Deployment
# Optimized for maximum speed with intelligent caching

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_status() {
    echo -e "${1}⚡ ${2}${NC}"
}

# Performance timer
START_TIME=$(date +%s)

print_status $CYAN "LIGHTNING FAST CLOUDFLARE PAGES DEPLOYMENT"
print_status $CYAN "=========================================="

# Ensure we're in project root
if [ ! -f "package.json" ] || [ ! -d "apps/web" ]; then
    print_status $RED "Error: Run from project root"
    exit 1
fi

# Set maximum performance optimizations
export CI=true
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export HUSKY=0
export TURBO_TELEMETRY_DISABLED=1
export DISABLE_ESLINT_PLUGIN=true
export SKIP_PREFLIGHT_CHECK=true
export FORCE_COLOR=0
export NODE_OPTIONS="--max-old-space-size=4096"

print_status $BLUE "Performance mode: MAXIMUM"

cd apps/web

# Smart cache check
BUILD_HASH=$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -exec ls -la {} \; | sha256sum | cut -d' ' -f1)
CACHE_FILE=".deployment-cache"

if [ -f "$CACHE_FILE" ] && [ -d "dist" ]; then
    CACHED_HASH=$(cat "$CACHE_FILE" 2>/dev/null || echo "")
    if [ "$BUILD_HASH" = "$CACHED_HASH" ]; then
        print_status $GREEN "Cache HIT! Skipping build (no changes detected)"
        ELAPSED=$(($(date +%s) - START_TIME))
        print_status $CYAN "Deploying cached build in ${ELAPSED}s..."
        
        npx wrangler pages deploy dist \
            --project-name=starter-nextjs-convex-ai \
            --compatibility-date=2025-08-03 \
            --compatibility-flags=nodejs_compat
        
        TOTAL_TIME=$(($(date +%s) - START_TIME))
        print_status $GREEN "LIGHTNING DEPLOYMENT COMPLETE! Total time: ${TOTAL_TIME}s"
        exit 0
    fi
fi

print_status $YELLOW "Cache MISS - Building..."

# Ultra-fast dependency check (skip if node_modules exists and package.json unchanged)
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    print_status $BLUE "Installing dependencies (optimized)..."
    bun install --frozen-lockfile --no-save --backend=hardlink
else
    print_status $GREEN "Dependencies up to date, skipping install"
fi

# Clean only what's necessary
print_status $BLUE "Quick clean..."
rm -rf dist .next/cache

# Lightning build with maximum parallelization
print_status $BLUE "Building (turbo mode)..."
NEXT_PRIVATE_SKIP_SIZE_LIMIT_CHECK=1 \
NEXT_PRIVATE_SKIP_VALIDATE=1 \
SKIP_TYPE_CHECK=true \
bun run build

if [ $? -ne 0 ]; then
    print_status $RED "Build failed"
    exit 1
fi

# Ultra-fast Pages generation (skip unnecessary features)
print_status $BLUE "Generating Pages (optimized)..."
npx @cloudflare/next-on-pages \
    --outdir=dist \
    --skip-build

# Cache the successful build
echo "$BUILD_HASH" > "$CACHE_FILE"

BUILD_TIME=$(($(date +%s) - START_TIME))
print_status $GREEN "Build completed in ${BUILD_TIME}s"

# Deploy with optimized settings
print_status $BLUE "Deploying to Cloudflare..."
npx wrangler pages deploy dist \
    --project-name=starter-nextjs-convex-ai \
    --compatibility-date=2025-08-03 \
    --compatibility-flags=nodejs_compat

TOTAL_TIME=$(($(date +%s) - START_TIME))

print_status $GREEN ""
print_status $GREEN "🚀 LIGHTNING DEPLOYMENT COMPLETE!"
print_status $CYAN "======================================"
print_status $GREEN "Total time: ${TOTAL_TIME}s"
print_status $GREEN "Build time: ${BUILD_TIME}s"  
print_status $GREEN "Deploy time: $((TOTAL_TIME - BUILD_TIME))s"
print_status $BLUE ""
print_status $BLUE "🌐 Site: https://starter-nextjs-convex-ai-5zy.pages.dev"
print_status $YELLOW "💡 Next deployment will be even faster with caching!"