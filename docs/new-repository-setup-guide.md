# New Repository Setup Guide

> **Goal**: Get a new repository based on this template up and running in the cloud with everything configured.

## Overview

This guide takes you from zero to a fully functional, deployed AI application with authentication, AI services, and CI/CD - all running in the cloud for under $10/month.

**Time Investment**: 2-3 hours for complete setup  
**Skill Level**: Intermediate (requires creating accounts and configuring services)  
**End Result**: Live application with GitHub authentication, AI chat, and automated deployments

## Prerequisites

Before starting, ensure you have:

- [ ] GitHub account with admin access to your new repository
- [ ] Credit card (for Convex, Cloudflare, and LLM API accounts - all have generous free tiers)
- [ ] Domain name (optional - you can use provided URLs)

## Setup Checklist

**Phase 1: Foundation** ⏱️ ~30 minutes

- [ ] [Clone and configure repository](#phase-1-foundation)
- [ ] [Set up environment management system](#step-1-environment-system-setup)
- [ ] [Initialize Convex backend](#step-2-convex-backend-setup)

**Phase 2: Authentication** ⏱️ ~45 minutes

- [ ] [Configure GitHub OAuth](#step-3-github-oauth-setup)
- [ ] [Configure Google OAuth (optional)](#step-4-google-oauth-setup-optional)

**Phase 3: AI Services** ⏱️ ~20 minutes

- [ ] [Set up OpenRouter or OpenAI](#step-5-ai-services-setup)

**Phase 4: Deployment** ⏱️ ~45 minutes

- [ ] [Configure Cloudflare Pages](#step-6-cloudflare-pages-deployment)
- [ ] [Set up GitHub Actions CI/CD](#step-7-cicd-pipeline-setup)

**Phase 5: Verification** ⏱️ ~15 minutes

- [ ] [Verify everything works](#step-8-verification)

---

## Phase 1: Foundation

### Step 1: Environment System Setup

**Goal**: Set up the centralized environment variable management system.

1. **Clone your repository**:

   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
   bun install
   ```

2. **Create environment source file**:

   ```bash
   cp .env.source-of-truth.example .env.source-of-truth.local
   ```

3. **Understand the table format**:
   The `.env.source-of-truth.local` file uses a human-readable table:

   ```
   | NEXTJS | CONVEX | GROUP             | KEY                       | VALUE                    |
   |--------|--------|-------------------|---------------------------|--------------------------|
   | true   | false  | Local Development | NEXT_PUBLIC_APP_URL       | http://localhost:3000    |
   | false  | true   | GitHub OAuth      | GITHUB_CLIENT_ID          | your_actual_id_here      |
   ```

4. **Test the sync system**:
   ```bash
   bun run sync-env --dry-run
   ```

✅ **Success Check**: Command runs without errors and shows it would generate environment files.

**📖 Detailed Guide**: [Environment Sync Workflow](./technical-guides/environment-sync-workflow.md)

### Step 2: Convex Backend Setup

**Goal**: Get your backend database and API running.

1. **Create Convex account**: Go to [convex.dev](https://convex.dev) and sign up

2. **Initialize Convex project**:

   ```bash
   cd apps/convex
   bunx convex dev
   ```

   - Follow prompts to create new project
   - Copy the deployment URL shown

3. **Update environment source**:
   Edit `.env.source-of-truth.local` and update the Convex section:

   ```
   | true   | true   | Convex            | CONVEX_DEPLOYMENT         | dev:your-deployment-name |
   | true   | true   | Convex            | NEXT_PUBLIC_CONVEX_URL    | https://your-deployment.convex.cloud |
   ```

4. **Sync environment variables**:
   ```bash
   bun run sync-env
   ```

✅ **Success Check**: Convex dashboard opens and shows your deployed functions.

**📖 Detailed Guide**: [Convex Components Guide](./technical-guides/convex-components-guide.md)

---

## Phase 2: Authentication

### Step 3: GitHub OAuth Setup

**Goal**: Enable "Continue with GitHub" authentication.

1. **Create GitHub OAuth App**:
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Click "OAuth Apps" → "New OAuth App"
   - Fill in:
     ```
     Application name: Your App Name (Dev)
     Homepage URL: http://localhost:3000
     Authorization callback URLs:
     http://localhost:3000/auth/github/callback
     http://localhost:3100/auth/github/callback
     https://your-staging-domain.com/auth/github/callback (add later)
     https://your-production-domain.com/auth/github/callback (add later)
     ```

2. **Get OAuth credentials**:
   - Copy Client ID and Client Secret

3. **Update environment source file**:

   ```
   | false  | true   | GitHub OAuth      | GITHUB_CLIENT_ID          | your_actual_client_id    |
   | false  | true   | GitHub OAuth      | GITHUB_CLIENT_SECRET      | your_actual_client_secret|
   ```

4. **Sync and test**:
   ```bash
   bun run sync-env
   bun dev
   ```

   - Visit `http://localhost:3000/login`
   - Test GitHub authentication

✅ **Success Check**: You can log in with GitHub and see user information.

**📖 Detailed Guide**: [GitHub OAuth Setup](./technical-guides/github-oauth-setup.md)

### Step 4: Google OAuth Setup (Optional)

**Goal**: Add "Continue with Google" as additional authentication option.

**Skip this step if you only want GitHub authentication.**

1. **Create Google Cloud Project**: [Google Cloud Console](https://console.cloud.google.com/)

2. **Set up OAuth consent screen and credentials**

3. **Update environment source file** with Google credentials

✅ **Success Check**: You can log in with both GitHub and Google.

**📖 Detailed Guide**: [Google OAuth Setup](./technical-guides/google-oauth-setup.md)

---

## Phase 3: AI Services

### Step 5: AI Services Setup

**Goal**: Enable AI chat functionality with OpenRouter (recommended) or OpenAI.

**Option A: OpenRouter (Recommended - cheaper, more models)**

1. **Create OpenRouter account**: Go to [openrouter.ai](https://openrouter.ai)

2. **Add credits**: Add $5-10 for development

3. **Create API key**: Copy the API key

4. **Update environment source file**:
   ```
   | false  | true   | LLM Config        | OPENROUTER_API_KEY        | sk-or-v1-your-key-here   |
   | false  | true   | LLM Config        | LLM_MODEL                 | openai/gpt-4o-mini       |
   | false  | true   | LLM Config        | LLM_FALLBACK_MODEL        | openai/gpt-4o-mini       |
   ```

**Option B: OpenAI Direct**

1. **Create OpenAI account**: [platform.openai.com](https://platform.openai.com)

2. **Add payment method and create API key**

3. **Update environment source file** with OpenAI credentials

4. **Sync and test**:
   ```bash
   bun run sync-env
   bun dev
   ```

   - Navigate to chat interface
   - Send test message

✅ **Success Check**: AI responds to your chat messages.

**📖 Detailed Guide**: [LLM API Setup](./technical-guides/llm-api-setup.md)

---

## Phase 4: Deployment

### Step 6: Cloudflare Pages Deployment

**Goal**: Deploy your application to the web with a public URL.

1. **Create Cloudflare account**: Go to [cloudflare.com](https://cloudflare.com)

2. **Create Pages project**:
   - Workers & Pages → Pages → Connect to Git
   - Select your repository
   - Configure build settings:
     ```
     Framework preset: None
     Build command: bun run build && bun run pages:build
     Build output directory: .vercel/output/static
     Root directory: apps/web
     ```

3. **Add environment variables in Cloudflare**:
   - `HUSKY=0`
   - `NEXT_PUBLIC_CONVEX_URL=your-convex-url`

4. **Enable Node.js compatibility**:
   - Settings → Functions → Compatibility flags
   - Add `nodejs_compat` to both Production and Preview

5. **Test deployment**:
   - Trigger deploy and visit the provided URL

✅ **Success Check**: Your application loads at the Cloudflare Pages URL and basic functionality works.

**📖 Detailed Guide**: [Cloudflare Pages Setup](./technical-guides/cloudflare-pages-setup.md)

### Step 7: CI/CD Pipeline Setup

**Goal**: Automate deployments when you push code to GitHub.

1. **Get required information**:
   - Cloudflare Account ID (from Cloudflare dashboard)
   - Cloudflare API Token (create with Pages:Edit permission)
   - Cloudflare Project Name (from Pages dashboard)

2. **Add GitHub Secrets**:
   - Repository Settings → Secrets and variables → Actions
   - Add these secrets:
     ```
     CLOUDFLARE_API_TOKEN=your-api-token
     CLOUDFLARE_ACCOUNT_ID=your-account-id
     CLOUDFLARE_PROJECT_NAME=your-project-name
     NEXT_PUBLIC_CONVEX_URL=your-convex-url
     ```

3. **Test CI/CD pipeline**:
   ```bash
   echo "# CI/CD Test - $(date)" >> README.md
   git add README.md
   git commit -m "test: verify CI/CD pipeline"
   bun run push
   ```

✅ **Success Check**: GitHub Actions runs successfully and your changes appear on the live site.

**📖 Detailed Guide**: [CI/CD Pipeline Setup](./technical-guides/cicd-pipeline-setup.md)

---

## Phase 5: Verification

### Step 8: Verification

**Goal**: Confirm everything works together correctly.

**Quick Verification**:

1. **Visit your live site** and confirm it loads
2. **Test authentication** (GitHub login works)
3. **Test AI chat** (sends messages and gets responses)
4. **Test deployment** (push a small change and see it go live)

**Comprehensive Verification**:
Use the [Setup Verification Checklist](./setup-verification-checklist.md) for systematic testing of all components.

✅ **Success Check**: All core functionality works in production.

---

## Completion

🎉 **Congratulations!** You now have:

- ✅ **Live application** running on Cloudflare Pages
- ✅ **Authentication** with GitHub (and optionally Google)
- ✅ **AI chat functionality** powered by OpenRouter/OpenAI
- ✅ **Automated deployments** via GitHub Actions
- ✅ **Real-time backend** with Convex
- ✅ **Cost-effective setup** under $10/month

## Next Steps

**For Development**:

- Review [Development Guide](./development-guide.md) for daily workflow
- Understand [Scripts and Commands Reference](./technical-guides/scripts-and-commands-reference.md)

**For Customization**:

- Explore [Architecture Documentation](./architecture/) for system design
- Check [Technical Guides](./technical-guides/) for advanced configuration

**For Team Setup**:

- Share your `.env.source-of-truth.local` file securely with team members
- Document any custom configuration in your project README

## Troubleshooting

### Common Issues

**Environment Variables Not Working**:

```bash
# Check your source file format
head -5 .env.source-of-truth.local

# Test sync process
bun run sync-env --dry-run --verbose
```

**Authentication Redirects Failing**:

- Verify callback URLs in OAuth app settings match exactly
- Check that environment variables synced correctly

**AI Chat Not Working**:

- Test API key directly: see [LLM API Setup](./technical-guides/llm-api-setup.md#test-api-access)
- Check API credits/billing

**Deployment Failures**:

- Check GitHub Actions logs for specific errors
- Verify all required secrets are set in GitHub

### Getting Help

- **Technical Issues**: Use the specific guide linked in each section
- **Detailed Verification**: Run the [Setup Verification Checklist](./setup-verification-checklist.md)
- **Complex Problems**: Check [CI Debugging Methodology](./technical-guides/ci-debugging-methodology.md)

---

**Created**: Dedicated guide for new repository setup  
**Goal**: Complete cloud deployment with all services configured  
**Maintenance**: Update when service setup procedures change
