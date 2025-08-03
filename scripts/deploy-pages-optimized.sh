#!/bin/bash

# Optimized Cloudflare Pages Deployment Script
# Handles timeouts and optimizes build process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_status $BLUE "🚀 Optimized Cloudflare Pages Deployment"
print_status $BLUE "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps/web" ]; then
    print_status $RED "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Navigate to web app
cd apps/web

print_status $YELLOW "📂 Working directory: $(pwd)"

# Load environment variables
if [ -f "../../.env.local" ]; then
    print_status $YELLOW "📄 Loading environment variables..."
    source ../../.env.local
fi

# Set CI optimizations
export CI=true
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export HUSKY=0

print_status $YELLOW "🔧 Environment optimizations:"
print_status $GREEN "   • CI mode enabled (faster builds)"
print_status $GREEN "   • Telemetry disabled"
print_status $GREEN "   • Husky hooks disabled"
print_status $GREEN "   • TypeScript/ESLint checks skipped in CI"

# Clean previous builds
print_status $YELLOW "🧹 Cleaning previous builds..."
rm -rf .next dist out .vercel

# Install dependencies with optimizations
print_status $YELLOW "📦 Installing dependencies..."
bun install --no-save --frozen-lockfile

# Build with timeout protection (macOS compatible)
print_status $YELLOW "🔨 Building Next.js application..."

# Use gtimeout if available (brew install coreutils), otherwise just run normally
if command -v gtimeout >/dev/null 2>&1; then
    gtimeout 600s bun run build || {
        print_status $RED "❌ Build timed out after 10 minutes"
        print_status $YELLOW "💡 Try running with more memory: NODE_OPTIONS='--max-old-space-size=4096' bun run build"
        exit 1
    }
else
    print_status $YELLOW "⚠️  Running without timeout protection (install coreutils for timeout support)"
    bun run build || {
        print_status $RED "❌ Build failed"
        exit 1
    }
fi

# Generate static export
print_status $YELLOW "📤 Generating static export..."

# Use gtimeout if available, otherwise just run normally
if command -v gtimeout >/dev/null 2>&1; then
    gtimeout 300s npx @cloudflare/next-on-pages --outdir=dist --experimental-minify || {
        print_status $RED "❌ Static export timed out after 5 minutes"
        print_status $YELLOW "💡 Trying without minification..."
        npx @cloudflare/next-on-pages --outdir=dist
    }
else
    npx @cloudflare/next-on-pages --outdir=dist --experimental-minify || {
        print_status $YELLOW "⚠️  Minification failed, trying without..."
        npx @cloudflare/next-on-pages --outdir=dist
    }
fi

# Verify build output
if [ ! -d "dist" ]; then
    print_status $RED "❌ Build failed: dist directory not found"
    exit 1
fi

print_status $GREEN "✅ Build completed successfully"

# Get file count and size
FILE_COUNT=$(find dist -type f | wc -l)
DIST_SIZE=$(du -sh dist | cut -f1)
print_status $BLUE "📊 Build stats: $FILE_COUNT files, $DIST_SIZE total"

# Deploy with retry logic
print_status $YELLOW "🚀 Deploying to Cloudflare Pages..."

DEPLOY_ATTEMPTS=3
ATTEMPT=1

while [ $ATTEMPT -le $DEPLOY_ATTEMPTS ]; do
    print_status $BLUE "🔄 Deployment attempt $ATTEMPT/$DEPLOY_ATTEMPTS"
    
    # Use gtimeout if available, otherwise just run normally
    if command -v gtimeout >/dev/null 2>&1; then
        DEPLOY_CMD="gtimeout 300s npx wrangler pages deploy dist --project-name=starter-nextjs-convex-ai"
    else
        DEPLOY_CMD="npx wrangler pages deploy dist --project-name=starter-nextjs-convex-ai"
    fi
    
    if $DEPLOY_CMD; then
        print_status $GREEN "✅ Deployment successful!"
        break
    else
        if [ $ATTEMPT -eq $DEPLOY_ATTEMPTS ]; then
            print_status $RED "❌ Deployment failed after $DEPLOY_ATTEMPTS attempts"
            print_status $YELLOW "💡 Troubleshooting tips:"
            print_status $YELLOW "   • Check Cloudflare account limits"
            print_status $YELLOW "   • Verify wrangler authentication: npx wrangler whoami"
            print_status $YELLOW "   • Try manual deployment via dashboard"
            exit 1
        else
            print_status $YELLOW "⚠️  Attempt $ATTEMPT failed, retrying in 10 seconds..."
            sleep 10
            ATTEMPT=$((ATTEMPT + 1))
        fi
    fi
done

# Get deployment URL
DEPLOYMENT_URL="https://starter-nextjs-convex-ai-5zy.pages.dev"

print_status $GREEN ""
print_status $GREEN "🎉 Deployment Complete!"
print_status $BLUE "=============================="
print_status $GREEN "🌐 Site URL: $DEPLOYMENT_URL"
print_status $BLUE ""
print_status $BLUE "🔍 Next Steps:"
print_status $YELLOW "   • Test site: curl -I $DEPLOYMENT_URL"
print_status $YELLOW "   • View logs: npx wrangler pages deployment tail"
print_status $YELLOW "   • Custom domain: Configure in Cloudflare dashboard"
print_status $BLUE ""
print_status $GREEN "✨ Your Next.js app is now live on Cloudflare Pages!"