# Dynamic Source Tree System

This directory contains dynamically generated source tree views of the project using gpt_context commands.

## Project Overview

**Name:** starter-nextjs-convex-ai  
**Type:** TypeScript Monorepo (Turborepo + Bun)  
**Architecture:** Edge-first, AI-native development template  
**Tech Stack:** Next.js, Convex, Cloudflare, TypeScript, Tailwind CSS, ShadCN UI

## Current Development State

**Latest Story:** 4.3 (Knowledge Ingestion Service completed)  
**Epic Status:** Epic 4 (Conversational AI) in progress  
**Major Systems:** Debug logs, authentication, knowledge ingestion, worker infrastructure

## Technology Stack Status

### ✅ Fully Implemented

- **Monorepo**: Turborepo + Bun package management
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Convex real-time database and serverless functions
- **Authentication**: BetterAuth with Convex adapter
- **UI Components**: ShadCN UI with custom theme system
- **CI/CD**: GitHub Actions with smart monitoring
- **Testing**: Jest (unit) + Playwright (E2E)
- **Workers**: Log ingestion worker with Redis integration
- **Knowledge System**: Vector embeddings with Cloudflare Vectorize

### 🔄 Partially Implemented

- **Cloudflare Integration**: Pages deployment, workers operational
- **Logging System**: Complete debug logs system with multi-tier architecture
- **AI Features**: Knowledge ingestion implemented, conversational AI in progress

### 📋 Planned

- **Advanced AI Features**: Self-modifying code capabilities
- **Production Monitoring**: Sentry integration
- **Advanced UI Features**: Complex component interactions

## Key Components Status

- **`.bmad-core/`** - ✅ Complete BMAD methodology framework
- **`.claude/`** - ✅ Claude Code integration
- **`apps/convex/`** - ✅ Backend with auth, logging, knowledge system
- **`apps/web/`** - ✅ Next.js app with debug interface, authentication
- **`apps/workers/`** - ✅ Log ingestion worker operational
- **`packages/ui/`** - ✅ Shared component library
- **`tests/`** - ✅ Comprehensive testing across all layers
- **`docs/`** - ✅ Extensive BMAD-structured documentation

## Using This System

1. **Manual Commands**: Use `commands.md` for individual gpt_context commands
2. **Batch Generation**: Run `generate-trees.sh` to refresh all views
3. **Live Views**: Generated markdown files provide current project state
4. **Categories**: 15 different views covering code, docs, tests, config, etc.

This system replaces static documentation with dynamic, always-current source trees.
