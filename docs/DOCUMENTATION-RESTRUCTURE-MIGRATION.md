# Documentation Restructure Migration Guide

## Why This Change Was Made

### The Problem

The original documentation structure created conflicts for projects built from this template:

1. **Template Development Artifacts**: Files like `docs/prd/`, `docs/stories/`, and `docs/project-brief.md` documented the development of THIS template, not applications built from it. These files would be irrelevant and confusing in target applications.

2. **Scattered Setup Documentation**: Template usage guides were mixed with general development documentation, making it unclear what was for template setup vs. application development.

3. **Universal Knowledge Buried**: Valuable technical guides, patterns, and architecture documentation was presented in the context of "template development" rather than as reusable application knowledge.

### The Solution

We implemented a **three-tier documentation architecture**:

- **`docs/template-development/`** - Files about building/improving THIS template (removed from target apps)
- **`docs/template-usage/`** - Files about setting up new projects from this template (removed from target apps)
- **`docs/`** - Universal knowledge valuable for any application built from this template (stays in target apps)

## Complete File Migration Map

### Template Development Files → `docs/template-development/`

```
OLD PATH                                    → NEW PATH
docs/prd.md                                → docs/template-development/prd.md
docs/prd/                                  → docs/template-development/prd/
docs/stories/                              → docs/template-development/stories/
docs/project-brief.md                      → docs/template-development/project-brief.md
docs/lessons-learned/stories/              → docs/template-development/lessons-learned/stories/
docs/historical/                           → docs/template-development/historical/
docs/development-server-startup-guide.md  → docs/template-development/development-server-startup-guide.md
docs/testing/uat/                         → docs/template-development/testing/uat/
-docs.md                                   → docs/template-development/-docs.md
-file-list.md                             → docs/template-development/-file-list.md
MOCK.md                                    → docs/template-development/MOCK.md
```

### Template Usage Files → `docs/template-usage/`

```
OLD PATH                                    → NEW PATH
docs/new-repository-setup-guide.md        → docs/template-usage/new-repository-setup-guide.md
docs/setup-verification-checklist.md      → docs/template-usage/setup-verification-checklist.md
(new file)                                 → docs/template-usage/index.md
```

### Universal Knowledge Files (Stay in `docs/`)

```
UNCHANGED PATHS (these stay in docs/ for target applications)
docs/technical-guides/
docs/patterns/
docs/methodology/
docs/examples/
docs/guides/
docs/architecture/
docs/testing/technical/
docs/development-guide.md
docs/index.md (updated content)
docs/lessons-learned/ (non-story content)
docs/peer-reviews/
docs/youtube-briefs/
```

## Reference Update Instructions

### For Other Conversations/Projects Using These Files

#### 1. Update Documentation Links

If you have references to moved files, update them:

```bash
# Find all references to moved files
grep -r "docs/prd" .
grep -r "docs/stories" .
grep -r "docs/project-brief" .
grep -r "docs/new-repository-setup-guide" .
```

#### 2. Search & Replace Patterns

Use these patterns to update references:

```bash
# Template development files
s|docs/prd/|docs/template-development/prd/|g
s|docs/stories/|docs/template-development/stories/|g
s|docs/project-brief.md|docs/template-development/project-brief.md|g
s|docs/historical/|docs/template-development/historical/|g
s|docs/development-server-startup-guide.md|docs/template-development/development-server-startup-guide.md|g

# Template usage files
s|docs/new-repository-setup-guide.md|docs/template-usage/new-repository-setup-guide.md|g
s|docs/setup-verification-checklist.md|docs/template-usage/setup-verification-checklist.md|g
```

#### 3. Content Changes to Be Aware Of

**docs/index.md**: Completely rewritten to focus on application development rather than template development

**docs/development-guide.md**: Hardcoded paths converted to placeholders (`{PROJECT_DIRECTORY}`, etc.)

**docs/architecture/**: Content updated to focus on application architecture patterns rather than template-specific decisions

### For Template Users (New Projects)

#### What to Delete from Target Applications

When creating a new project from this template, delete these directories:

```bash
rm -rf docs/template-development/
rm -rf docs/template-usage/
```

#### What to Keep

Keep everything in `docs/` - these are universal patterns, guides, and architecture documentation valuable for any application.

## Verification Steps

### 1. Check File Locations

```bash
# Verify template development files moved
ls docs/template-development/prd/
ls docs/template-development/stories/

# Verify template usage files moved
ls docs/template-usage/

# Verify universal files stayed
ls docs/technical-guides/
ls docs/patterns/
```

### 2. Check Link Updates

```bash
# Check for broken internal links
grep -r "docs/prd/" docs/ --include="*.md"
grep -r "docs/stories/" docs/ --include="*.md"
```

### 3. Verify New Structure Purpose

- **docs/template-development/**: Only files about building THIS template
- **docs/template-usage/**: Only files about using this template to create new projects
- **docs/**: Only universal knowledge applicable to any application

## Benefits Achieved

✅ **No More Conflicts**: Template artifacts isolated from target applications  
✅ **Clear Purpose Separation**: Development vs Usage vs Universal Knowledge  
✅ **Universal Value Preserved**: Technical guides/patterns remain accessible  
✅ **Template Usability Improved**: Clear setup documentation in dedicated section  
✅ **Target App Clarity**: Documentation focused on building applications, not templates

## Breaking Changes

### For Template Development

- Update any scripts or tooling that reference the old paths
- Update CLAUDE.md or AI instructions that reference moved files
- Update any CI/CD processes that depend on file locations

### For Template Usage

- New projects should reference `docs/template-usage/new-repository-setup-guide.md`
- Setup verification is now at `docs/template-usage/setup-verification-checklist.md`

### For Application Development

- Main documentation index is now focused on application development
- Architecture documentation is now application-focused rather than template-focused
- Some content in lessons-learned may have moved to template-development

---

**Date**: 2025-01-01  
**Migration Type**: Three-tier documentation architecture restructure  
**Impact**: Major organizational change, breaking changes to file paths  
**Reason**: Resolve conflicts between template development, template usage, and universal application knowledge
