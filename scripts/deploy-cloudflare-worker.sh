#!/bin/bash

# Cloudflare Worker Deployment Script
# Deploys log ingestion worker with all required environment variables

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_status $BLUE "🚀 Cloudflare Worker Deployment Pipeline"
print_status $BLUE "========================================"

# Check if we're in the project root
if [ ! -f "package.json" ] || [ ! -d "apps/workers/log-ingestion" ]; then
    print_status $RED "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Load environment variables
if [ -f ".env.local" ]; then
    print_status $YELLOW "📄 Loading root environment variables..."
    source .env.local
fi

# Navigate to worker directory
cd apps/workers/log-ingestion

# Load worker-specific environment variables
if [ -f ".env.local" ]; then
    print_status $YELLOW "📄 Loading worker environment variables..."
    source .env.local
fi

# Check required environment variables
required_vars=("UPSTASH_REDIS_REST_URL" "UPSTASH_REDIS_REST_TOKEN")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    print_status $RED "❌ Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        print_status $RED "   • $var"
    done
    print_status $YELLOW "📝 Please set these in .env.local or as environment variables"
    exit 1
fi

print_status $GREEN "✅ All required environment variables are present"

# Determine deployment environment
ENVIRONMENT=${1:-"production"}
if [ "$ENVIRONMENT" != "development" ] && [ "$ENVIRONMENT" != "production" ]; then
    print_status $RED "❌ Invalid environment: $ENVIRONMENT"
    print_status $YELLOW "📝 Usage: $0 [development|production]"
    exit 1
fi

print_status $BLUE "🎯 Deploying to: $ENVIRONMENT"

# Build the worker
print_status $YELLOW "🔨 Building worker..."
bun run build

# Set up secrets
print_status $YELLOW "🔐 Setting up secrets for $ENVIRONMENT environment..."

# Function to set secret safely
set_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if [ -z "$secret_value" ]; then
        print_status $YELLOW "⚠️  Warning: $secret_name is empty, skipping..."
        return
    fi
    
    print_status $BLUE "🔐 Setting secret: $secret_name"
    echo "$secret_value" | npx wrangler secret put "$secret_name" --env "$ENVIRONMENT" 2>/dev/null || {
        print_status $YELLOW "⚠️  Failed to set $secret_name (may already exist or require authentication)"
    }
}

# Set required secrets
set_secret "UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_TOKEN"

# Set optional secrets
if [ -n "$OPENROUTER_API_KEY" ]; then
    set_secret "OPENROUTER_API_KEY" "$OPENROUTER_API_KEY"
fi

# Deploy the worker
print_status $YELLOW "🚀 Deploying worker to Cloudflare..."
if [ "$ENVIRONMENT" = "production" ]; then
    npx wrangler deploy --env production
else
    npx wrangler deploy --env development
fi

# Get deployment info
print_status $GREEN "✅ Deployment complete!"
print_status $BLUE ""
print_status $BLUE "📋 Deployment Summary:"
print_status $BLUE "======================"
print_status $GREEN "Environment: $ENVIRONMENT"
print_status $GREEN "Redis URL: $UPSTASH_REDIS_REST_URL"
print_status $GREEN "Worker Name: log-ingestion-worker"

# Show worker URL
if [ "$ENVIRONMENT" = "production" ]; then
    WORKER_URL="https://log-ingestion-worker.oneie.workers.dev"
else
    WORKER_URL="https://log-ingestion-worker.oneie.workers.dev"
fi

print_status $BLUE ""
print_status $BLUE "🌐 Worker Endpoints:"
print_status $GREEN "   Health Check: $WORKER_URL/health"
print_status $GREEN "   Log Ingestion: $WORKER_URL/log"
print_status $GREEN "   Log Retrieval: $WORKER_URL/logs?trace_id=xxx"
print_status $GREEN "   Recent Traces: $WORKER_URL/traces/recent"

print_status $BLUE ""
print_status $BLUE "🔍 Next Steps:"
print_status $YELLOW "   • Test health endpoint: curl $WORKER_URL/health"
print_status $YELLOW "   • View secrets: bun run secrets:list:prod"
print_status $YELLOW "   • Monitor logs: wrangler tail --env $ENVIRONMENT"

print_status $GREEN ""
print_status $GREEN "🎉 Deployment successful! Worker is live at: $WORKER_URL"