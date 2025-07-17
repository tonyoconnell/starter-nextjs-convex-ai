# Starter NextJS Convex AI

> An opinionated, production-grade starter template for building AI-native applications using modern edge-first technologies and the BMAD (Breakthrough Method for Agile AI Driven Development) methodology.

## Overview

This template provides a foundational solution for developers, architects, and tech-savvy entrepreneurs to rapidly build AI-first applications. It combines a best-in-class technical foundation with integrated workflows for managing an AI workforce, enabling you to act as a "Context Engineer" directing AI agents to build robust, maintainable applications.

### Key Features

- **AI-First Architecture** - Built from the ground up for AI agent collaboration with Claude Code integration
- **BMAD Methodology** - Structured approach to AI-assisted development with context engineering
- **Modern Edge Stack** - Next.js, Convex, TypeScript, Tailwind CSS deployed on Cloudflare
- **Real-time Development** - Chrome DevTools to Claude Code bridge for seamless debugging
- **Production Ready** - Built-in error tracking, monitoring, and testing infrastructure
- **Cost Optimized** - Designed to run under $10/month at small scale

## Tech Stack

- **Frontend**: Next.js 14+ (App Router) with TypeScript
- **Backend**: Convex for real-time data and serverless functions
- **Styling**: Tailwind CSS + ShadCN UI components
- **Deployment**: Cloudflare Pages/Workers for edge computing
- **Package Manager**: Bun for fast, modern dependency management
- **Testing**: Jest (unit), Playwright (E2E)
- **Monitoring**: Sentry, PostHog integration ready

## Getting Started

### Prerequisites

- Node.js 18+ or Bun runtime
- Git
- Chrome/Chromium browser (for dev tools integration)
- Claude Code account (for AI assistance)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/appydave/starter-nextjs-convex-ai.git
cd starter-nextjs-convex-ai
```

2. Install dependencies:

```bash
bun install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Start the development servers:

```bash
# Terminal 1: Start Convex backend
bunx convex dev

# Terminal 2: Start Next.js with Claude integration
bun dev:claude
```

5. Open http://localhost:3000 in your browser

### Quick Commands

```bash
# Development
bun dev              # Start development server
bun dev:claude       # Development with Claude logging integration

# Build & Production
bun build            # Build for production
bun start            # Start production server

# Testing
bun test             # Run Jest unit tests
bun test:e2e         # Run Playwright E2E tests
bun test:e2e:ui      # Run Playwright with UI mode

# Code Quality
bun lint             # Run ESLint
bun format           # Run Prettier
bun typecheck        # Run TypeScript compiler checks

# Convex Backend
bunx convex dev      # Start Convex development server
bunx convex deploy   # Deploy Convex functions

# Claude Integration
bun chrome:debug     # Start Chrome with debugging port
bun claude:bridge    # Start Claude Dev Bridge for log capture
```

## Project Structure

```
starter-nextjs-convex-ai/
├── apps/web/              # Next.js application
│   ├── app/              # App Router pages and layouts
│   ├── components/       # React components
│   ├── lib/             # Utilities and shared code
│   └── convex/          # Convex backend functions
├── packages/
│   ├── ui/              # Shared UI components library
│   └── convex/          # Shared Convex schemas/helpers
├── tests/               # E2E Playwright tests
├── docs/                # Comprehensive documentation
│   ├── methodology/     # BMAD method guides
│   ├── technical-guides/# Implementation guides
│   └── historical/      # Planning documents
├── CLAUDE.md            # Claude Code specific instructions
└── README.md            # This file
```

## Development Workflow

### BMAD Method

This project follows the BMAD (Before, Model, After, Document) methodology:

1. **Before**: Capture context and requirements
2. **Model**: Use Claude Code for implementation
3. **After**: Verify, test, and refine results
4. **Document**: Update documentation and learnings

### AI-Assisted Development

1. **Setup Chrome DevTools Integration**

   ```bash
   bun chrome:debug      # Start Chrome with debugging
   bun claude:bridge     # Start log capture bridge
   ```

2. **Work with Claude Code**
   - Use CLAUDE.md for project-specific AI guidance
   - Leverage built-in context from documentation
   - Follow established patterns and conventions

3. **Testing & Validation**
   - Unit tests for business logic
   - Integration tests for Convex functions
   - E2E tests for critical user flows
   - Automatic test result capture to Claude

### Deployment

The template is configured for edge deployment on Cloudflare Pages:

```bash
# Deploy to Cloudflare Pages (automatic on git push)
git push origin main

# Manual deployment (if needed)
npx wrangler pages deploy apps/web/.vercel/output/static --project-name=your-project

# Deploy Convex backend
bunx convex deploy --prod
```

📖 **Important**: For first-time deployment setup, see the **[Cloudflare Pages Setup Guide](./docs/technical-guides/cloudflare-pages-setup.md)** for detailed configuration instructions.

## Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[Getting Started Guide](./docs/index.md)** - Overview and quick start
- **[Cloudflare Pages Setup](./docs/technical-guides/cloudflare-pages-setup.md)** - Complete deployment setup guide
- **[Project Brief](./docs/project-brief.md)** - Vision and objectives
- **[Product Requirements](./docs/prd.md)** - Detailed specifications
- **[Architecture Guide](./docs/architecture.md)** - Technical decisions
- **[BMAD Methodology](./docs/methodology/bmad-context-engineering.md)** - AI development approach
- **[Technical Guides](./docs/technical-guides/)** - Implementation patterns

## Key Innovations

### Chrome DevTools to Claude Code Bridge

Seamless integration between browser debugging and AI assistance:

- Zero-friction console log capture
- Automatic context preservation
- E2E test integration

### Cost-Conscious Architecture

Built to scale efficiently on modern platforms:

- Hybrid logging pattern for < $10/month operation
- Smart error sampling with Sentry
- Convex-first data strategy

### AI-Native Development Flow

Every aspect optimized for AI collaboration:

- Context-rich documentation
- Specialized agent personas
- Continuous feedback loops

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

Areas for contribution:

- Additional agent personas
- Integration patterns
- Cost optimization strategies
- Developer experience improvements

## Community

- **Discord**: [Join our community](https://discord.gg/starter-nextjs)
- **GitHub Discussions**: [Ask questions and share ideas](https://github.com/appydave/starter-nextjs-convex-ai/discussions)
- **Twitter**: [@appydave](https://twitter.com/appydave)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [BMAD Method](https://github.com/bmadcode/BMAD-METHOD) - For the development methodology
- [Claude Code](https://claude.ai/code) - Anthropic's official CLI
- [Convex](https://convex.dev) - Real-time backend platform
- [Vercel](https://vercel.com) - For Next.js and deployment inspiration
- [ShadCN](https://ui.shadcn.com) - For the UI component patterns

---

_Built with AI assistance for the AI-assisted development era._
