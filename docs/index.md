# Starter NextJS Convex AI - Documentation

## Overview

This is a Next.js template for building AI-first applications using the BMAD (Breakthrough Method for Agile AI Driven Development) methodology. It combines modern web development practices with structured AI-assisted development workflows.

## Key Features

- **AI-First Architecture** - Built from the ground up for AI agent collaboration
- **BMAD Methodology** - Structured approach to AI-assisted development
- **Modern Stack** - Next.js, Convex, TypeScript, Tailwind CSS
- **Developer Experience** - Chrome DevTools to Claude Code integration
- **Cost-Effective** - Optimized for <$10/month at small scale

## Quick Links

- **[Getting Started](../README.md)** - Setup and installation
- **[Development Guide](./development-guide.md)** - Port management and development workflow
- **[CLAUDE.md](../CLAUDE.md)** - Claude Code specific instructions
- **[BMAD Method](./methodology/bmad-context-engineering.md)** - Development methodology

## 🚀 New Repository Setup

**To get a new repository running in the cloud with everything configured:**

🎯 **[New Repository Setup Guide](./new-repository-setup-guide.md)** ⏱️ 2-3 hours

Dedicated step-by-step guide for deploying this template to production with all services configured.

## Core Documentation (BMAD-METHOD)

Following BMAD methodology, these documents form the foundation:

- **[Project Brief](./project-brief.md)** - Project goals and constraints
- **[Product Requirements (PRD)](./prd/)** - Detailed product requirements document (sharded)
- **[Architecture](./architecture/)** - Technical architecture and design decisions (sharded)

### 📋 Product Requirements (Sharded)

**[prd/](./prd/)**

- **[PRD Overview](./prd/index.md)** - Navigation and complete requirements overview
- **[Epic 1: Platform Foundation](./prd/epic-1.md)** - Monorepo, deployment, and authentication
- **[Epic 2: UI Toolkit](./prd/epic-2.md)** - Component showcase and theming
- **[Epic 3: Real-time Logging](./prd/epic-3.md)** - Resilient logging architecture
- **[Epic 4: Conversational AI](./prd/epic-4.md)** - RAG foundation and chat interface
- **[Epic 5: Production Features](./prd/epic-5.md)** - Quality of life improvements
- **[Epic 6: Documentation](./prd/epic-6.md)** - Onboarding and deployment guides
- **[Epic 7: Hybrid Workflow](./prd/epic-7.md)** - Experimental agent workflow

### 🏗️ Architecture (Sharded)

**[architecture/](./architecture/)**

- **[Architecture Overview](./architecture/index.md)** - Complete architecture navigation
- **[High-Level Architecture](./architecture/high-level-architecture.md)** - System diagrams and patterns
- **[Tech Stack](./architecture/tech-stack.md)** - Technology choices and versions
- **[Data Models](./architecture/data-models.md)** - Database schema and relationships
- **[API Implementation](./architecture/api-implementation-details.md)** - OpenAPI and Convex functions
- **[Components](./architecture/components.md)** - Component interaction patterns
- **[Coding Standards](./architecture/coding-standards.md)** - Development conventions
- **[Security](./architecture/security.md)** - Multi-layered security strategy

## Documentation Structure

### 📚 Methodology

**[methodology/](./methodology/)**

- **[BMAD Context Engineering](./methodology/bmad-context-engineering.md)** - Structured AI development approach
- **[Agentic Architect Developer Persona](./methodology/agentic-architect-developer-persona.md)** - AI personas for requirements gathering

### 🔧 Technical Guides

**[technical-guides/](./technical-guides/)**

- **[TypeScript Configuration Best Practices](./technical-guides/typescript-configuration-best-practices.md)** - Battle-tested TypeScript config patterns for monorepos, focusing on consistency and environment parity
- **[CI/Environment Debugging Methodology](./technical-guides/ci-debugging-methodology.md)** - Systematic approach to debugging CI failures, environment differences, and build configuration issues
- **[Cost-Effective Logging](./technical-guides/cost-effective-logging-in-convex-agentic-systems.md)** - Convex logging strategies under $10/month
- **[Dev Error Pipeline](./technical-guides/dev-error-pipeline.md)** - Chrome DevTools to Claude Code integration
- **[Convex Components Guide](./technical-guides/convex-components-guide.md)** - Convex architecture patterns and component examples
- **[Authentication Architecture](./technical-guides/authentication-architecture.md)** - Complete authentication system architecture and security patterns
- **[Cloudflare Pages Setup](./technical-guides/cloudflare-pages-setup.md)** - Step-by-step Cloudflare Pages deployment guide
- **[Cloudflare Pages Troubleshooting](./technical-guides/cloudflare-pages-deployment-troubleshooting.md)** - Systematic troubleshooting for deployment issues

### 🧪 Testing

**[testing/](./testing/)**

#### Technical Testing (For Developers)

- **[Testing Infrastructure Lessons Learned](./testing/technical/testing-infrastructure-lessons-learned.md)** - **START HERE for debugging** - Real problems and solutions from testing implementation
- **[Testing Patterns](./testing/technical/testing-patterns.md)** - **For implementation** - Concrete patterns for React components, hooks, Convex functions
- **[Test Strategy & Standards](./testing/technical/test-strategy-and-standards.md)** - **For context** - Testing framework, coverage targets, CI/CD integration

#### Functional Testing (For QA/Product)

- **[Functional Test Plans](./testing/uat/)** - User acceptance testing for individual stories

### 📚 Knowledge-Driven Development (KDD)

**Comprehensive guides and systematic knowledge libraries:**

#### [Implementation Guides](./guides/)

Complete implementation and usage guides for AI agents and developers:

- **[KDD Implementation Guide](./guides/kdd-implementation-guide.md)** - Complete KDD methodology implementation framework
- **[KDD Setup Guide](./guides/kdd-setup-guide.md)** - Practical setup guide with quick start and real examples
- **[Sprint Estimation Implementation Guide](./guides/sprint-estimation-implementation-guide.md)** - BMAD enhancement with sprint planning capabilities

#### [YouTube Briefs](./youtube-briefs/)

Video creation briefs for sharing knowledge and demonstrations:

- **[CI Monitoring Automation Brief](./youtube-briefs/ci-monitoring-automation-brief.md)** - Smart push and CI monitoring system demonstration
- **[Sprint Estimation Brief](./youtube-briefs/sprint-estimation-brief.md)** - BMAD sprint planning enhancement video guide
- **[KDD Methodology Brief](./youtube-briefs/kdd-methodology-brief.md)** - Knowledge-Driven Development video presentation guide

**Knowledge Libraries for systematic development:**

#### [Patterns Library](./patterns/)

Established architectural patterns and best practices:

- **[Frontend Patterns](./patterns/frontend-patterns.md)** - React, Next.js, and UI patterns
- **[Backend Patterns](./patterns/backend-patterns.md)** - Convex, API, and server-side patterns
- **[Testing Patterns](./testing/technical/testing-patterns.md)** - Testing strategies across all layers
- **[Architecture Patterns](./patterns/architecture-patterns.md)** - System design patterns
- **[Development Workflow Patterns](./patterns/development-workflow-patterns.md)** - Process and collaboration patterns

#### [Examples Library](./examples/)

Real implementation examples from the project:

- **[Monorepo Setup](./examples/monorepo-setup/)** - Complete Bun/Turborepo configuration example
- **[Frontend Examples](./examples/frontend/)** - React and Next.js implementation examples
- **[Backend Examples](./examples/backend/)** - Convex function examples and runtime patterns
  - **[Knowledge Ingestion Deployment Patterns](./examples/backend/knowledge-ingestion-deployment-patterns.md)** - Vector storage deployment patterns and configuration management
- **[Testing Examples](./examples/testing/)** - Comprehensive testing examples
- **[CI/CD Deployment Examples](./examples/cicd-deployment/)** - Complete CI/CD pipeline and deployment examples
- **[Configuration Examples](./examples/configuration/)** - Project configuration examples

#### [Lessons Learned](./lessons-learned/)

Cross-story insights and knowledge capture:

- **[Story Lessons](./lessons-learned/stories/)** - Insights from individual story implementations
  - **[Story 1.6 Lessons](./lessons-learned/stories/story-1-6-lessons.md)** - CI/CD Pipeline implementation learnings
  - **[Story 4.2 Knowledge Ingestion Lessons](./lessons-learned/stories/story-4.2-knowledge-ingestion-lessons.md)** - Cloudflare Vectorize integration and vector storage patterns
- **[Technology Lessons](./lessons-learned/technology/)** - Technology-specific learnings
- **[Process Lessons](./lessons-learned/process/)** - Development workflow insights
- **[Anti-Patterns](./lessons-learned/anti-patterns/)** - Approaches to avoid

#### [Peer Reviews](./peer-reviews/)

Architectural discussions and external feedback:

- **[Convex Structure Analysis](./peer-reviews/convex-structure-analysis.md)** - Review of monorepo structure vs simplified approach

### 🚧 Historical Work

**[historical/](./historical/)**

- **[Overview](./historical/index.md)** - Early planning documents
- **[Tech Stack](./historical/preliminary-tech-stack.md)** - Technology choices
- **[Epics](./historical/preliminary-epics.md)** - Feature breakdown

## Development Workflow

```mermaid
graph TD
    subgraph "Input & Feedback Sources"
        direction LR
        A[Production<br/>(Sentry, PostHog, Logs)]
        B[User<br/>(Feedback Widget)]
        C[Developer/PO<br/>(Directives)]
        D[Testing<br/>(Playwright, CI)]
        E[Data & Process<br/>(Pipelines, Reviews)]
    end
    subgraph "Core Agentic System"
        direction TB
        F((Knowledge Base <br/> Vector + Graph Context))
        G{AI Workforce <br/> (Claude Code Agents)}
        H(BMAD-METHOD <br/> Process & Templates)
    end
    subgraph "Outputs & Artifacts"
        direction LR
        I[Codebase]
        J[Documentation]
        K[GitHub Issues]
        L[Test Data Profiles]
        M[Agent Definitions]
    end
    A --> G
    B --> G
    C --> G
    D --> G
    E --> G
    G --> F
    F --> H
    H --> F
    H --> I
    H --> J
    H --> K
    H --> L
    H --> M
```

## Getting Started with Development

1. **Review Core Documents**
   - Read [Project Brief](./project-brief.md) for context
   - Study [PRD Overview](./prd/index.md) for requirements navigation
   - Understand [Architecture Overview](./architecture/index.md) for technical decisions

2. **Understand the Methodology**
   - Read [BMAD Context Engineering](./methodology/bmad-context-engineering.md)
   - Review the [Agentic Persona](./methodology/agentic-architect-developer-persona.md)

3. **Setup Development Environment**
   - Follow the [Dev Error Pipeline](./technical-guides/dev-error-pipeline.md) setup
   - Configure Chrome DevTools integration

4. **Start Building**
   - Use BMAD agents for planning
   - Implement with Claude Code
   - Test with integrated tooling

## Key Innovations

### 1. Chrome DevTools to Claude Code Bridge

Seamless integration between browser debugging and AI assistance:

- Zero-friction console log capture
- Automatic context preservation
- E2E test integration

### 2. Cost-Conscious Architecture

Built to scale efficiently:

- Hybrid logging pattern
- Smart error sampling
- Convex-first data strategy

### 3. AI-Native Development Flow

Every aspect optimized for AI collaboration:

- Context-rich story files
- Specialized agent personas
- Continuous feedback loops

## Contributing

This template is designed to evolve. Contributions are welcome in:

- Additional agent personas
- Integration patterns
- Cost optimization strategies
- Developer experience improvements

## Resources

- **BMAD Method**: [GitHub - bmadcode/BMAD-METHOD](https://github.com/bmadcode/BMAD-METHOD)
- **Claude Code**: [Anthropic's official CLI](https://claude.ai/code)
- **Convex**: [Backend platform](https://convex.dev)
- **Community**: Join the discussion on Discord

---

_This project demonstrates how AI can be a true development partner when given proper context and structure. It's not about replacing developers, but amplifying their capabilities through intelligent collaboration._
