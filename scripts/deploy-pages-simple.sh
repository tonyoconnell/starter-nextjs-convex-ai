#!/bin/bash

# Simple Cloudflare Pages Deployment Script
# Optimized for macOS without external dependencies

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${1}${2}${NC}"
}

print_status $BLUE "🚀 Cloudflare Pages Deployment"
print_status $BLUE "==============================="

# Ensure we're in project root
if [ ! -f "package.json" ] || [ ! -d "apps/web" ]; then
    print_status $RED "❌ Error: Please run from project root directory"
    exit 1
fi

# Load environment variables
if [ -f ".env.local" ]; then
    print_status $YELLOW "📄 Loading environment variables..."
    source .env.local
fi

print_status $BLUE "📂 Working in: $(pwd)"

# Navigate to web app
cd apps/web

# Set optimizations
export CI=true
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export HUSKY=0

print_status $YELLOW "🔧 CI optimizations enabled"

# Clean previous builds
print_status $YELLOW "🧹 Cleaning previous builds..."
rm -rf .next dist out

# Install dependencies
print_status $YELLOW "📦 Installing dependencies..."
bun install --frozen-lockfile

# Build Next.js
print_status $YELLOW "🔨 Building Next.js application..."
bun run build

if [ $? -ne 0 ]; then
    print_status $RED "❌ Next.js build failed"
    exit 1
fi

# Generate Cloudflare Pages build
print_status $YELLOW "📤 Generating Cloudflare Pages build..."
npx @cloudflare/next-on-pages --outdir=dist

if [ $? -ne 0 ]; then
    print_status $YELLOW "⚠️  Trying without experimental features..."
    npx @cloudflare/next-on-pages --outdir=dist --no-minify
fi

# Verify build output
if [ ! -d "dist" ]; then
    print_status $RED "❌ Build failed: dist directory not found"
    exit 1
fi

print_status $GREEN "✅ Build completed successfully"

# Deploy
print_status $YELLOW "🚀 Deploying to Cloudflare Pages..."

npx wrangler pages deploy dist \
    --project-name=starter-nextjs-convex-ai \
    --compatibility-date=2025-08-03 \
    --compatibility-flags=nodejs_compat

if [ $? -eq 0 ]; then
    print_status $GREEN ""
    print_status $GREEN "🎉 Deployment successful!"
    print_status $BLUE "🌐 Site: https://starter-nextjs-convex-ai-5zy.pages.dev"
    print_status $YELLOW "📋 Next steps:"
    print_status $YELLOW "   • Test site functionality"
    print_status $YELLOW "   • Check deployment logs in dashboard"
else
    print_status $RED "❌ Deployment failed"
    print_status $YELLOW "💡 Troubleshooting:"
    print_status $YELLOW "   • Check wrangler auth: npx wrangler whoami"
    print_status $YELLOW "   • Verify project name in dashboard"
    print_status $YELLOW "   • Try manual deployment via dashboard"
    exit 1
fi