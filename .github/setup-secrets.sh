#!/bin/bash

# GitHub Secrets Setup Script
# Run this script to add all required secrets for automated deployment

REPO="tonyoconnell/starter-nextjs-convex-ai"

echo "🔐 Setting up GitHub Secrets for $REPO"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is required. Install: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Please authenticate with GitHub CLI: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI authenticated"

# Set secrets
echo "Setting Cloudflare secrets..."
gh secret set CLOUDFLARE_ACCOUNT_ID --body "627e0c7ccbe735a4a7cabf91e377bbad" --repo $REPO
gh secret set CLOUDFLARE_API_TOKEN --body "2751f1e8bdbc3cf9481e0cff345605c9bd3b9" --repo $REPO

echo "Setting Convex secrets..."
gh secret set CONVEX_DEPLOY_KEY --body "prod:friendly-hedgehog-812|eyJ2MiI6IjczMDA5YjBiM2VkNDQ3MjlhYmU4OTk5Zjg0MjFhNGQ3In0=" --repo $REPO
gh secret set NEXT_PUBLIC_CONVEX_URL --body "https://friendly-hedgehog-812.convex.cloud" --repo $REPO

echo "Setting application secrets..."
gh secret set NEXT_PUBLIC_BETTER_AUTH_URL --body "https://starter-nextjs-convex-ai.pages.dev" --repo $REPO

echo "✅ All secrets configured!"
echo ""
echo "🚀 Ready to deploy! Run:"
echo "   git push origin main"
echo ""
echo "📊 Monitor deployment at:"
echo "   https://github.com/$REPO/actions"