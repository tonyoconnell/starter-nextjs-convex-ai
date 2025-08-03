#!/bin/bash

# Cloudflare Worker Environment Setup Script
# Sets up all required secrets for both development and production environments

set -e

echo "🔧 Setting up Cloudflare Worker environment variables..."

# Check if we're in the right directory
if [ ! -f "wrangler.toml" ]; then
    echo "❌ Error: wrangler.toml not found. Please run this script from the worker directory."
    exit 1
fi

# Load environment variables from .env.local if it exists
if [ -f ".env.local" ]; then
    echo "📄 Loading environment variables from .env.local..."
    source .env.local
fi

# Function to set secret for both dev and production
set_secret() {
    local secret_name=$1
    local secret_value=$2
    local environment=${3:-""}
    
    if [ -z "$secret_value" ]; then
        echo "⚠️  Warning: $secret_name is empty, skipping..."
        return
    fi
    
    echo "🔐 Setting secret: $secret_name"
    
    if [ -n "$environment" ]; then
        echo "$secret_value" | npx wrangler secret put "$secret_name" --env "$environment"
    else
        echo "$secret_value" | npx wrangler secret put "$secret_name"
    fi
}

# Set secrets for development environment
echo ""
echo "🚀 Setting up DEVELOPMENT environment secrets..."
set_secret "UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_TOKEN" "development"

# Set secrets for production environment  
echo ""
echo "🏭 Setting up PRODUCTION environment secrets..."
set_secret "UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_TOKEN" "production"

# Optional: Set OpenRouter API Key if present
if [ -n "$OPENROUTER_API_KEY" ]; then
    echo ""
    echo "🤖 Setting up OpenRouter API Key..."
    set_secret "OPENROUTER_API_KEY" "$OPENROUTER_API_KEY" "development"
    set_secret "OPENROUTER_API_KEY" "$OPENROUTER_API_KEY" "production"
fi

echo ""
echo "✅ Environment setup complete!"
echo ""
echo "📋 Summary of configured secrets:"
echo "   • UPSTASH_REDIS_REST_TOKEN (dev & prod)"
if [ -n "$OPENROUTER_API_KEY" ]; then
echo "   • OPENROUTER_API_KEY (dev & prod)"
fi
echo ""
echo "🔍 To verify your secrets:"
echo "   npx wrangler secret:list --env development"
echo "   npx wrangler secret:list --env production"
echo ""
echo "🚀 Ready to deploy:"
echo "   bun run deploy          # Deploy to production"
echo "   bun run deploy:dev      # Deploy to development"