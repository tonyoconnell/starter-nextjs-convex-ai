# Architecture Context

> **Generated:** 2025-08-07 02:11:43 UTC  
> **Source:** gpt_context.rb dynamic analysis  
> **Description:** Code plus architectural documentation

---

├─ apps
│ ├─ convex
│ │ ├─ agent.ts
│ │ ├─ agentActions.ts
│ │ ├─ auth.ts
│ │ ├─ cleanup.old.ts
│ │ ├─ cleanupLoggingTables.ts
│ │ ├─ debugActions.ts
│ │ ├─ debugLogs.ts
│ │ ├─ email.ts
│ │ ├─ internalLogging.ts
│ │ ├─ knowledge.ts
│ │ ├─ knowledgeActions.ts
│ │ ├─ knowledgeMutations.ts
│ │ ├─ lib
│ │ │ ├─ auth.ts
│ │ │ ├─ config.ts
│ │ │ ├─ redisLogFetcher.ts
│ │ │ ├─ textProcessing.ts
│ │ │ ├─ vectorize.ts
│ │ ├─ logCorrelation.old.ts
│ │ ├─ logStreamsWebhook.ts
│ │ ├─ loggingAction.ts
│ │ ├─ migrations.ts
│ │ ├─ monitoring.ts
│ │ ├─ queries.ts
│ │ ├─ rateLimiter.deprecated.ts
│ │ ├─ rateLimiter.old.ts
│ │ ├─ schema.ts
│ │ ├─ simpleCleanup.ts
│ │ ├─ users.ts
│ │ ├─ workerSync.ts
│ ├─ web
│ │ ├─ **tests**
│ │ │ ├─ centralized-rate-limiting.test.ts
│ │ │ ├─ log-correlation-engine.test.ts
│ │ │ ├─ log-streams-webhook-logic.test.ts
│ │ │ ├─ logging-action-enhancements.test.ts
│ │ ├─ app
│ │ │ ├─ api
│ │ │ │ ├─ redis-stats
│ │ │ │ │ └─ route.ts
│ │ │ ├─ debug
│ │ │ │ ├─ lib
│ │ │ │ │ ├─ debug-api.ts
│ │ │ │ ├─ components
│ │ │ │ │ ├─ CorrelationPanel.tsx
│ │ │ │ │ ├─ ExportControls.tsx
│ │ │ │ │ ├─ LogEntryCard.tsx
│ │ │ │ │ ├─ LogTableViewer.tsx
│ │ │ │ │ ├─ RecentTraces.tsx
│ │ │ │ │ ├─ TestLogGenerator.tsx
│ │ │ │ │ ├─ TimelineViewer.tsx
│ │ │ │ │ ├─ TraceSearchForm.tsx
│ │ │ │ ├─ page.tsx
│ │ │ ├─ auth
│ │ │ │ ├─ github
│ │ │ │ │ ├─ callback
│ │ │ │ │ │ └─ page.tsx
│ │ │ │ ├─ google
│ │ │ │ │ └─ callback
│ │ │ │ │ └─ page.tsx
│ │ │ ├─ change-password
│ │ │ │ ├─ page.tsx
│ │ │ ├─ chat
│ │ │ │ ├─ page.tsx
│ │ │ ├─ debug-logs
│ │ │ │ ├─ page.tsx
│ │ │ ├─ dev
│ │ │ │ ├─ page.tsx
│ │ │ ├─ forgot-password
│ │ │ │ ├─ page.tsx
│ │ │ ├─ layout.tsx
│ │ │ ├─ login
│ │ │ │ ├─ page.tsx
│ │ │ ├─ page.tsx
│ │ │ ├─ protected
│ │ │ │ ├─ page.tsx
│ │ │ ├─ providers.tsx
│ │ │ ├─ register
│ │ │ │ ├─ page.tsx
│ │ │ ├─ reset-password
│ │ │ │ ├─ page.tsx
│ │ │ ├─ showcase
│ │ │ │ ├─ **tests**
│ │ │ │ │ ├─ page.test.tsx
│ │ │ │ ├─ page.tsx
│ │ │ ├─ test-llm
│ │ │ │ └─ page.tsx
│ │ ├─ lib
│ │ │ ├─ **tests**
│ │ │ │ ├─ console-override.test.ts
│ │ │ ├─ auth.ts
│ │ │ ├─ config.ts
│ │ │ ├─ console-override.ts
│ │ │ ├─ convex-api.ts
│ │ │ ├─ convex.ts
│ │ │ ├─ email
│ │ │ │ ├─ **tests**
│ │ │ │ │ ├─ email-service.test.ts
│ │ │ │ │ ├─ email-templates.test.ts
│ │ │ │ ├─ email-service.ts
│ │ │ │ ├─ email-templates.ts
│ │ │ ├─ utils.ts
│ │ │ ├─ version-storage.ts
│ │ │ ├─ version-utils.ts
│ │ │ ├─ test-utils.tsx
│ │ ├─ next-env.d.ts
│ │ ├─ types
│ │ │ ├─ chat.ts
│ │ ├─ components
│ │ │ ├─ auth
│ │ │ │ ├─ **tests**
│ │ │ │ │ ├─ auth-provider-methods.test.tsx
│ │ │ │ │ ├─ auth-provider.test.tsx
│ │ │ │ │ ├─ change-password-form.test.tsx
│ │ │ │ │ ├─ github-oauth-button.test.tsx
│ │ │ │ │ ├─ google-oauth-button.test.tsx
│ │ │ │ │ ├─ login-form.test.tsx
│ │ │ │ │ ├─ logout-button.test.tsx
│ │ │ │ │ ├─ password-reset-confirm-form.test.tsx
│ │ │ │ │ ├─ password-reset-form.test.tsx
│ │ │ │ │ ├─ register-form.test.tsx
│ │ │ │ │ ├─ remember-me.test.tsx
│ │ │ │ ├─ auth-provider.tsx
│ │ │ │ ├─ change-password-form.tsx
│ │ │ │ ├─ github-oauth-button.tsx
│ │ │ │ ├─ google-oauth-button.tsx
│ │ │ │ ├─ login-form.tsx
│ │ │ │ ├─ logout-button.tsx
│ │ │ │ ├─ password-reset-confirm-form.tsx
│ │ │ │ ├─ password-reset-form.tsx
│ │ │ │ ├─ register-form.tsx
│ │ │ ├─ chat
│ │ │ │ ├─ **tests**
│ │ │ │ │ ├─ assistant-message.test.tsx
│ │ │ │ │ ├─ chat-interface.test.tsx
│ │ │ │ │ ├─ message-list.test.tsx
│ │ │ │ │ ├─ typing-indicator.test.tsx
│ │ │ │ │ ├─ user-message.test.tsx
│ │ │ │ ├─ assistant-message.tsx
│ │ │ │ ├─ chat-interface.tsx
│ │ │ │ ├─ message-list.tsx
│ │ │ │ ├─ typing-indicator.tsx
│ │ │ │ ├─ user-message.tsx
│ │ │ ├─ debug-logs
│ │ │ │ ├─ **tests**
│ │ │ │ │ ├─ cleanup-controls.test.tsx
│ │ │ │ │ ├─ cost-monitoring.test.tsx
│ │ │ │ │ ├─ database-health.test.tsx
│ │ │ │ │ ├─ debug-logs-page.test.tsx
│ │ │ │ │ ├─ log-search.test.tsx
│ │ │ │ │ ├─ rate-limit-status.test.tsx
│ │ │ │ │ ├─ system-health-overview.test.tsx
│ │ │ │ ├─ cleanup-controls.tsx
│ │ │ │ ├─ cost-monitoring.tsx
│ │ │ │ ├─ database-health.tsx
│ │ │ │ ├─ debug-logs-table.tsx
│ │ │ │ ├─ export-controls-card.tsx
│ │ │ │ ├─ log-search.tsx
│ │ │ │ ├─ rate-limit-status.tsx
│ │ │ │ ├─ redis-stats-card.tsx
│ │ │ │ ├─ suppression-rules-panel.tsx
│ │ │ │ ├─ sync-controls-card.tsx
│ │ │ │ ├─ system-health-overview.tsx
│ │ │ ├─ dev
│ │ │ │ ├─ **tests**
│ │ │ │ │ ├─ mock-email-viewer.test.tsx
│ │ │ │ ├─ mock-email-viewer.tsx
│ │ │ │ ├─ version-debug.tsx
│ │ │ │ ├─ version-flash-notification.tsx
│ │ │ │ ├─ version-indicator.tsx
│ │ │ │ ├─ version-provider.tsx
│ │ │ ├─ logging
│ │ │ │ ├─ **tests**
│ │ │ │ │ ├─ logging-provider.test.tsx
│ │ │ │ │ ├─ logging-status.test.tsx
│ │ │ │ ├─ logging-provider.tsx
│ │ │ │ ├─ logging-status.tsx
│ │ │ └─ theme
│ │ │ ├─ **tests**
│ │ │ │ ├─ theme-integration.test.tsx
│ │ │ │ ├─ theme-provider.test.tsx
│ │ │ │ ├─ theme-toggle.test.tsx
│ │ │ ├─ theme-provider.tsx
│ │ │ └─ theme-toggle.tsx
│ ├─ workers
│ │ └─ log-ingestion
│ │ └─ src
│ │ ├─ index.ts
│ │ ├─ log-processor.ts
│ │ ├─ rate-limiter.ts
│ │ ├─ redis-client.ts
│ │ └─ types.ts
├─ packages
│ ├─ ui
│ │ ├─ index.ts
│ │ └─ src
│ │ ├─ lib
│ │ │ ├─ utils.ts
│ │ ├─ **tests**
│ │ │ ├─ button.test.tsx
│ │ │ ├─ card.test.tsx
│ │ │ ├─ input.test.tsx
│ │ ├─ alert-dialog.tsx
│ │ ├─ alert.tsx
│ │ ├─ badge.tsx
│ │ ├─ button.tsx
│ │ ├─ card.tsx
│ │ ├─ checkbox.tsx
│ │ ├─ collapsible.tsx
│ │ ├─ dropdown-menu.tsx
│ │ ├─ input.tsx
│ │ ├─ label.tsx
│ │ ├─ progress.tsx
│ │ ├─ select.tsx
│ │ ├─ separator.tsx
│ │ ├─ table.tsx
│ │ ├─ tabs.tsx
│ │ ├─ textarea.tsx
│ │ └─ tooltip.tsx
└─ docs
├─ architecture
│ ├─ api-implementation-details.md
│ ├─ architectural-addendum-final-clarifications.md
│ ├─ coding-standards.md
│ ├─ components.md
│ ├─ data-models.manifest.json
│ ├─ data-models.md
│ ├─ error-handling-strategy.md
│ ├─ high-level-architecture.md
│ ├─ index.md
│ ├─ infrastructure-and-deployment.md
│ ├─ introduction.md
│ ├─ real-time-user-data-synchronization-kdd.md
│ ├─ schema-manifest-system.md
│ ├─ security.md
│ ├─ source-tree
│ │ ├─ README.md
│ │ ├─ all-files-no-hidden.md
│ │ ├─ all-files-with-hidden.md
│ │ ├─ architecture-context.md
│ │ ├─ backend-only.md
│ │ ├─ code-only.md
│ │ ├─ code-plus-tests.md
│ │ ├─ commands.md
│ │ ├─ config-only.md
│ │ ├─ deployment-files.md
│ │ ├─ deprecation-cleanup.md
│ │ ├─ docs-permanent.md
│ │ ├─ docs-transient.md
│ │ ├─ frontend-only.md
│ │ ├─ generate-trees.sh
│ │ ├─ hidden-only.md
│ │ ├─ test-segmented.md
│ ├─ tech-stack.md
├─ patterns
│ ├─ architecture-patterns.md
│ ├─ backend-patterns.md
│ ├─ development-workflow-patterns.md
│ ├─ frontend-patterns.md
│ ├─ index.md
│ ├─ react-act-warning-prevention.md
│ ├─ testing-architecture-patterns.md
└─ methodology
├─ agentic-architect-developer-persona.md
├─ bmad-context-engineering.md
├─ bmad-overview.md
├─ discovery-mode-kdd-protocol.md
├─ features-documentation-kdd.md
├─ kdd-integration-overview.md
├─ multi-layer-manifest-architecture-kdd.md
└─ youtube-brief-methodology.md
