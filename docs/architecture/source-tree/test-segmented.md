# Test Segmented

> **Generated:** 2025-08-06 04:04:45 UTC  
> **Source:** gpt_context.rb dynamic analysis  
> **Description:** Tests by location and module type

---

├─ tests
│ ├─ convex
│ │ ├─ **mocks**
│ │ │ ├─ \_generated
│ │ │ │ ├─ api.js
│ │ │ │ ├─ server.js
│ │ │ ├─ convex
│ │ │ │ └─ values.js
│ │ ├─ auth-owner-access.test.ts
│ │ ├─ fixtures
│ │ │ ├─ testData.ts
│ │ ├─ knowledge.test.ts
│ │ ├─ knowledgeActions.test.ts
│ │ ├─ knowledgeMutations.test.ts
│ │ ├─ lib
│ │ │ ├─ config.test.ts
│ │ │ ├─ textProcessing.test.ts
│ │ │ ├─ vectorize.test.ts
│ │ ├─ setup.ts
│ ├─ web
│ │ ├─ **tests**
│ │ │ ├─ centralized-rate-limiting.test.ts
│ │ │ ├─ log-correlation-engine.test.ts
│ │ │ ├─ log-streams-webhook-logic.test.ts
│ │ │ ├─ logging-action-enhancements.test.ts
│ │ ├─ app
│ │ │ ├─ showcase
│ │ │ │ └─ **tests**
│ │ │ │ └─ page.test.tsx
│ │ ├─ centralized-rate-limiting.test.ts
│ │ ├─ components
│ │ │ ├─ admin
│ │ │ │ ├─ **tests**
│ │ │ │ │ ├─ cleanup-controls.test.tsx
│ │ │ │ │ ├─ cost-monitoring.test.tsx
│ │ │ │ │ ├─ database-health.test.tsx
│ │ │ │ │ ├─ log-search.test.tsx
│ │ │ │ │ ├─ rate-limit-status.test.tsx
│ │ │ │ │ └─ system-health-overview.test.tsx
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
│ │ │ │ │ └─ remember-me.test.tsx
│ │ │ ├─ chat
│ │ │ │ ├─ **tests**
│ │ │ │ │ ├─ assistant-message.test.tsx
│ │ │ │ │ ├─ chat-interface.test.tsx
│ │ │ │ │ ├─ message-list.test.tsx
│ │ │ │ │ ├─ typing-indicator.test.tsx
│ │ │ │ │ └─ user-message.test.tsx
│ │ │ ├─ debug-logs
│ │ │ │ ├─ debug-logs-page.test.tsx
│ │ │ │ ├─ debug-logs-table.test.tsx
│ │ │ ├─ dev
│ │ │ │ ├─ **tests**
│ │ │ │ │ ├─ mock-email-viewer.test.tsx
│ │ │ │ ├─ version-flash-notification.test.tsx
│ │ │ │ ├─ version-indicator.test.tsx
│ │ │ │ ├─ version-provider.test.tsx
│ │ │ ├─ logging
│ │ │ │ ├─ **tests**
│ │ │ │ │ ├─ logging-provider.test.tsx
│ │ │ │ │ ├─ logging-status.test.tsx
│ │ │ │ ├─ logging-provider.test.tsx
│ │ │ ├─ theme
│ │ │ │ └─ **tests**
│ │ │ │ ├─ theme-integration.test.tsx
│ │ │ │ ├─ theme-provider.test.tsx
│ │ │ │ └─ theme-toggle.test.tsx
│ │ ├─ integration
│ │ │ ├─ version-tracking.test.ts
│ │ ├─ lib
│ │ │ ├─ **tests**
│ │ │ │ ├─ console-override.test.ts
│ │ │ ├─ console-override.test.ts
│ │ │ ├─ email
│ │ │ │ ├─ **tests**
│ │ │ │ │ ├─ email-service.test.ts
│ │ │ │ │ └─ email-templates.test.ts
│ │ │ ├─ version-storage.test.ts
│ │ │ ├─ version-utils.test.ts
│ │ ├─ log-correlation-engine.test.ts
│ │ ├─ log-streams-webhook-logic.test.ts
│ │ ├─ logging-action-enhancements.test.ts
│ ├─ workers
│ │ └─ log-ingestion
│ │ ├─ coverage
│ │ │ ├─ clover.xml
│ │ │ ├─ coverage-final.json
│ │ │ ├─ lcov-report
│ │ │ │ ├─ base.css
│ │ │ │ ├─ block-navigation.js
│ │ │ │ ├─ favicon.png
│ │ │ │ ├─ index.html
│ │ │ │ ├─ prettify.css
│ │ │ │ ├─ prettify.js
│ │ │ │ ├─ sort-arrow-sprite.png
│ │ │ │ ├─ sorter.js
│ │ │ ├─ lcov.info
│ │ │ ├─ workers
│ │ │ │ ├─ base.css
│ │ │ │ ├─ block-navigation.js
│ │ │ │ ├─ coverage-summary.json
│ │ │ │ ├─ favicon.png
│ │ │ │ ├─ index.html
│ │ │ │ ├─ lcov-report
│ │ │ │ │ ├─ base.css
│ │ │ │ │ ├─ block-navigation.js
│ │ │ │ │ ├─ favicon.png
│ │ │ │ │ ├─ index.html
│ │ │ │ │ ├─ prettify.css
│ │ │ │ │ ├─ prettify.js
│ │ │ │ │ ├─ sort-arrow-sprite.png
│ │ │ │ │ ├─ sorter.js
│ │ │ │ ├─ lcov.info
│ │ │ │ ├─ prettify.css
│ │ │ │ ├─ prettify.js
│ │ │ │ ├─ sort-arrow-sprite.png
│ │ │ │ └─ sorter.js
│ │ ├─ integration
│ │ │ ├─ cross-system.test.ts
│ │ │ ├─ integration.test.ts
│ │ │ ├─ jest-globals.ts
│ │ │ ├─ load.test.ts
│ │ │ ├─ migration.test.ts
│ │ │ ├─ setup.ts
│ │ └─ src
│ │ ├─ index.test.ts
│ │ ├─ log-processor.test.ts
│ │ ├─ rate-limiter.test.ts
│ │ └─ redis-client.test.ts
├─ apps
│ ├─ web
│ │ ├─ app
│ │ │ ├─ debug
│ │ │ │ ├─ components
│ │ │ │ │ └─ TestLogGenerator.tsx
│ │ │ ├─ test-llm
│ │ │ ├─ showcase
│ │ │ │ └─ **tests**
│ │ │ │ └─ page.test.tsx
│ │ ├─ dist
│ │ │ ├─ \_next
│ │ │ │ ├─ static
│ │ │ │ │ └─ chunks
│ │ │ │ │ └─ app
│ │ │ │ │ └─ test-llm
│ │ │ ├─ test-llm
│ │ ├─ lib
│ │ │ ├─ test-utils.tsx
│ │ │ ├─ **tests**
│ │ │ │ ├─ console-override.test.ts
│ │ │ ├─ email
│ │ │ │ └─ **tests**
│ │ │ │ ├─ email-service.test.ts
│ │ │ │ └─ email-templates.test.ts
│ │ ├─ out
│ │ │ ├─ \_next
│ │ │ │ ├─ static
│ │ │ │ │ └─ chunks
│ │ │ │ │ └─ app
│ │ │ │ │ └─ test-llm
│ │ │ ├─ test-llm
│ │ ├─ **tests**
│ │ │ ├─ centralized-rate-limiting.test.ts
│ │ │ ├─ log-correlation-engine.test.ts
│ │ │ ├─ log-streams-webhook-logic.test.ts
│ │ │ ├─ logging-action-enhancements.test.ts
│ │ └─ components
│ │ ├─ auth
│ │ │ ├─ **tests**
│ │ │ │ ├─ auth-provider-methods.test.tsx
│ │ │ │ ├─ auth-provider.test.tsx
│ │ │ │ ├─ change-password-form.test.tsx
│ │ │ │ ├─ github-oauth-button.test.tsx
│ │ │ │ ├─ google-oauth-button.test.tsx
│ │ │ │ ├─ login-form.test.tsx
│ │ │ │ ├─ logout-button.test.tsx
│ │ │ │ ├─ password-reset-confirm-form.test.tsx
│ │ │ │ ├─ password-reset-form.test.tsx
│ │ │ │ ├─ register-form.test.tsx
│ │ │ │ └─ remember-me.test.tsx
│ │ ├─ chat
│ │ │ ├─ **tests**
│ │ │ │ ├─ assistant-message.test.tsx
│ │ │ │ ├─ chat-interface.test.tsx
│ │ │ │ ├─ message-list.test.tsx
│ │ │ │ ├─ typing-indicator.test.tsx
│ │ │ │ └─ user-message.test.tsx
│ │ ├─ debug-logs
│ │ │ ├─ **tests**
│ │ │ │ ├─ cleanup-controls.test.tsx
│ │ │ │ ├─ cost-monitoring.test.tsx
│ │ │ │ ├─ database-health.test.tsx
│ │ │ │ ├─ debug-logs-page.test.tsx
│ │ │ │ ├─ log-search.test.tsx
│ │ │ │ ├─ rate-limit-status.test.tsx
│ │ │ │ └─ system-health-overview.test.tsx
│ │ ├─ dev
│ │ │ ├─ **tests**
│ │ │ │ └─ mock-email-viewer.test.tsx
│ │ ├─ logging
│ │ │ ├─ **tests**
│ │ │ │ ├─ logging-provider.test.tsx
│ │ │ │ └─ logging-status.test.tsx
│ │ └─ theme
│ │ └─ **tests**
│ │ ├─ theme-integration.test.tsx
│ │ ├─ theme-provider.test.tsx
│ │ └─ theme-toggle.test.tsx
└─ packages
└─ ui
└─ src
└─ **tests**
├─ button.test.tsx
├─ card.test.tsx
└─ input.test.tsx
