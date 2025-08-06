# Features Index

This directory contains documentation for features implemented in the template repository. Each feature document provides the information needed to understand, extract, and integrate functionality into other repositories.

## Available Features

### Debug & Development Tools

- **[Debug Logs System](debug-logs-system.md)** - Complete Multi-Tier Logging & Debug Interface
  - **Epic**: [Epic 3: Resilient Real-time Logging](../template-development/prd/epic-3.md)
  - **Story**: Story 3.6 - Redis Data Sync & Legacy Code Migration
  - **Impact**: 35+ files total, 3,800+ insertions
  - **Architecture**: Cloudflare Worker → Redis Buffer → Convex Database → React Dashboard
  - **Key Features**:
    - **Frontend**: 11 React components, responsive sidebar dashboard, real-time data sync
    - **Backend**: 8 Convex functions, Redis integration, authentication-aware logging
    - **Worker**: 5 modules for ingestion, rate limiting, and Redis management
    - **Testing**: 35+ test files across components and worker integration
    - **Development Only**: Environment-restricted access, smart volume warnings
    - **Export System**: Claude-optimized formats for AI debugging workflows

### Infrastructure & Developer Experience

- **[Dynamic Source Tree System](dynamic-source-tree-system.md)** - Always-Current Project Navigation
  - **Epic**: Infrastructure Enhancement (Ad-hoc)
  - **Story**: Replace Static Documentation with Dynamic Views
  - **Impact**: 18 files total (3 system + 15 generated views)
  - **Architecture**: gpt_context.rb → Dynamic Analysis → Categorized Source Trees
  - **Key Features**:
    - **15 Categorized Views**: Code, docs, tests, config, deployment, module-specific
    - **Dynamic Generation**: Always-current data from live file system
    - **Manual Commands**: Direct gpt_context.rb access for individual views
    - **Batch Automation**: Single script generates all views with timestamps
    - **Zero Maintenance**: Eliminates stale static documentation burden
    - **Cross-Repository Ready**: Designed for feature extraction and adoption

## How to Use This Documentation

### For Template Extension

If you're building on this template, use these docs to understand what features are already implemented and how they work.

### For Feature Extraction

If you want to adopt specific features in another repository:

1. **Browse Features**: Review this index to find functionality you need
2. **Read Feature Documentation**: Each feature doc lists all files created/modified
3. **Copy Files**: Extract the documented files to your target repository
4. **Adapt Configuration**: Follow dependency and configuration notes
5. **Test Integration**: Verify the feature works in your environment

### For Development

When implementing new features:

1. **Follow Story Development**: Implement according to story requirements
2. **Document Feature**: Create new feature doc using the template
3. **Update Index**: Add feature to this index with summary information
4. **Link Epic/Story**: Reference original requirements for context

## Documentation Format

Each feature document includes:

- **New Features Added**: Bullet-point list of actual functionality implemented
- **Files Added/Modified**: Complete manifest of all file changes
- **Technical Impact**: Quantified metrics (files changed, insertions, etc.)
- **Key Benefits**: User-facing value delivered by the feature

## Cross-Repository Integration

This documentation system enables:

- **Selective Feature Adoption**: Extract specific functionality without full template duplication
- **Implementation Awareness**: Understand what was actually built vs what was planned
- **Dependency Management**: Clear documentation of external requirements
- **Knowledge Transfer**: Efficient feature sharing between development teams

## Templates and Standards

- **Feature Template**: [templates/feature-template.md](templates/feature-template.md) - Standardized format for new feature documentation
- **Feature Manifests**: [manifests/](manifests/) - Machine-readable JSON files for multi-layer feature synchronization
- **Naming Convention**: Use descriptive kebab-case names matching functionality
- **File Manifests**: Must include complete list of new/modified files
- **Story References**: Link to original Epic/Story but focus on implementation reality

### Feature Manifests

For complex features spanning multiple layers (Next.js + Convex + Workers), create structured manifest files:

- **Location**: `manifests/{feature-name}.manifest.json`
- **Purpose**: Enable automated repository synchronization via repo-sync agent
- **Structure**: JSON format defining frontend, backend, and worker layer files and dependencies
- **Usage**: Referenced by repo-sync agent for intelligent cross-repository feature adoption

## Maintenance

This documentation is maintained as part of the story development process:

- Feature docs created during story completion
- Index updated with each new feature
- File manifests kept current with implementation changes
- Cross-repository adoption workflows validated

---

**Repository**: [starter-nextjs-convex-ai](https://github.com/appydave-templates/starter-nextjs-convex-ai)
**Template Purpose**: Next.js + Convex + AI development template with extractable features
**Documentation System**: Part of BMAD (Breakthrough Method for Agile AI Driven Development) methodology
