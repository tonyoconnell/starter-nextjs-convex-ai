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
- **[CLAUDE.md](../CLAUDE.md)** - Claude Code specific instructions
- **[BMAD Method](./methodology/bmad-context-engineering.md)** - Development methodology

## Core Documentation (BMAD-METHOD)

Following BMAD methodology, these documents form the foundation:

- **[Project Brief](./project-brief.md)** - Project goals and constraints
- **[Product Requirements (PRD)](./prd.md)** - Detailed product requirements document
- **[Architecture](./architecture.md)** - Technical architecture and design decisions

## Documentation Structure

### 📚 Methodology
**[methodology/](./methodology/)**
- **[BMAD Context Engineering](./methodology/bmad-context-engineering.md)** - Structured AI development approach
- **[Agentic Architect Developer Persona](./methodology/agentic-architect-developer-persona.md)** - AI personas for requirements gathering

### 🔧 Technical Guides
**[technical-guides/](./technical-guides/)**
- **[Cost-Effective Logging](./technical-guides/cost-effective-logging-in-convex-agentic-systems.md)** - Convex logging strategies under $10/month
- **[Dev Error Pipeline](./technical-guides/dev-error-pipeline.md)** - Chrome DevTools to Claude Code integration

### 🚧 Preliminary Work
**[preliminary/](./preliminary/)**
- **[Overview](./preliminary/index.md)** - Early planning documents
- **[Tech Stack](./preliminary/preliminary-tech-stack.md)** - Technology choices
- **[Epics](./preliminary/preliminary-epics.md)** - Feature breakdown

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
   - Study [PRD](./prd.md) for requirements
   - Understand [Architecture](./architecture.md) decisions

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

*This project demonstrates how AI can be a true development partner when given proper context and structure. It's not about replacing developers, but amplifying their capabilities through intelligent collaboration.*