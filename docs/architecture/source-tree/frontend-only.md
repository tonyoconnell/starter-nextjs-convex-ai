# Frontend Only

> **Generated:** 2025-08-06 04:04:45 UTC  
> **Source:** gpt_context.rb dynamic analysis  
> **Description:** Next.js web app only

---

├─ apps
│ ├─ web
│ │ ├─ README.md
│ │ ├─ **tests**
│ │ │ ├─ centralized-rate-limiting.test.ts
│ │ │ ├─ log-correlation-engine.test.ts
│ │ │ ├─ log-streams-webhook-logic.test.ts
│ │ │ ├─ logging-action-enhancements.test.ts
│ │ ├─ app
│ │ │ ├─ api
│ │ │ │ ├─ redis-stats
│ │ │ │ │ └─ route.ts
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
│ │ │ ├─ debug
│ │ │ │ ├─ components
│ │ │ │ │ ├─ CorrelationPanel.tsx
│ │ │ │ │ ├─ ExportControls.tsx
│ │ │ │ │ ├─ LogEntryCard.tsx
│ │ │ │ │ ├─ LogTableViewer.tsx
│ │ │ │ │ ├─ RecentTraces.tsx
│ │ │ │ │ ├─ TestLogGenerator.tsx
│ │ │ │ │ ├─ TimelineViewer.tsx
│ │ │ │ │ ├─ TraceSearchForm.tsx
│ │ │ │ ├─ hooks
│ │ │ │ ├─ lib
│ │ │ │ │ ├─ debug-api.ts
│ │ │ │ ├─ page.tsx
│ │ │ ├─ debug-env
│ │ │ │ ├─ page.tsx
│ │ │ ├─ debug-logs
│ │ │ │ ├─ page.tsx
│ │ │ ├─ dev
│ │ │ │ ├─ page.tsx
│ │ │ ├─ forgot-password
│ │ │ │ ├─ page.tsx
│ │ │ ├─ globals.css
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
│ │ ├─ apps
│ │ │ ├─ web
│ │ │ │ └─ tsconfig.src.json
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
│ │ │ ├─ theme
│ │ │ │ ├─ **tests**
│ │ │ │ │ ├─ theme-integration.test.tsx
│ │ │ │ │ ├─ theme-provider.test.tsx
│ │ │ │ │ ├─ theme-toggle.test.tsx
│ │ │ │ ├─ theme-provider.tsx
│ │ │ │ └─ theme-toggle.tsx
│ │ ├─ components.json
│ │ ├─ coverage
│ │ │ ├─ base.css
│ │ │ ├─ block-navigation.js
│ │ │ ├─ favicon.png
│ │ │ ├─ index.html
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
│ │ │ ├─ prettify.css
│ │ │ ├─ prettify.js
│ │ │ ├─ sort-arrow-sprite.png
│ │ │ ├─ sorter.js
│ │ ├─ dist
│ │ │ ├─ 404
│ │ │ │ ├─ index.html
│ │ │ ├─ 404.html
│ │ │ ├─ \_headers
│ │ │ ├─ \_next
│ │ │ │ ├─ static
│ │ │ │ │ ├─ build_1754262320697
│ │ │ │ │ │ ├─ \_buildManifest.js
│ │ │ │ │ │ ├─ \_ssgManifest.js
│ │ │ │ │ ├─ chunks
│ │ │ │ │ │ ├─ 108-2bfe596ec743145a.js
│ │ │ │ │ │ ├─ 117-99ed76ecd624afe6.js
│ │ │ │ │ │ ├─ 144.cb4fad02d88849c7.js
│ │ │ │ │ │ ├─ 1dd3208c-e8236b598a80fd86.js
│ │ │ │ │ │ ├─ 203-838518ae5286684d.js
│ │ │ │ │ │ ├─ 235-3bd7e9e876eefc49.js
│ │ │ │ │ │ ├─ 266-b2173a70b87f9526.js
│ │ │ │ │ │ ├─ 340-d3101206b9d55f5a.js
│ │ │ │ │ │ ├─ 342-e80eb803939b30c3.js
│ │ │ │ │ │ ├─ 38-b16b1c12665b5400.js
│ │ │ │ │ │ ├─ 528-b0a42500cf9b4c56.js
│ │ │ │ │ │ ├─ 540.3a55e6706d0bc17b.js
│ │ │ │ │ │ ├─ 684-c610ae46c912dac0.js
│ │ │ │ │ │ ├─ 696-13233ea4cd3586b3.js
│ │ │ │ │ │ ├─ 831-673b63ce9d531ab5.js
│ │ │ │ │ │ ├─ app
│ │ │ │ │ │ │ ├─ \_not-found
│ │ │ │ │ │ │ │ ├─ page-0600d3737d016317.js
│ │ │ │ │ │ │ ├─ admin
│ │ │ │ │ │ │ │ ├─ layout-64007fd5de68e6cd.js
│ │ │ │ │ │ │ │ ├─ logs
│ │ │ │ │ │ │ │ │ └─ page-168216ba84b33e84.js
│ │ │ │ │ │ │ ├─ auth
│ │ │ │ │ │ │ │ ├─ github
│ │ │ │ │ │ │ │ │ ├─ callback
│ │ │ │ │ │ │ │ │ │ └─ page-f42cd5fc27913661.js
│ │ │ │ │ │ │ │ ├─ google
│ │ │ │ │ │ │ │ │ └─ callback
│ │ │ │ │ │ │ │ │ └─ page-67ecd43260f43866.js
│ │ │ │ │ │ │ ├─ change-password
│ │ │ │ │ │ │ │ ├─ page-166cec67f59a3750.js
│ │ │ │ │ │ │ ├─ chat
│ │ │ │ │ │ │ │ ├─ page-dac5c76e1b6904db.js
│ │ │ │ │ │ │ ├─ debug
│ │ │ │ │ │ │ │ ├─ page-40e93e939a1cb577.js
│ │ │ │ │ │ │ ├─ debug-env
│ │ │ │ │ │ │ │ ├─ page-70d51803c96f6bbb.js
│ │ │ │ │ │ │ ├─ dev
│ │ │ │ │ │ │ │ ├─ page-653cac842561eaa4.js
│ │ │ │ │ │ │ ├─ forgot-password
│ │ │ │ │ │ │ │ ├─ page-ea9d6cafef1ff830.js
│ │ │ │ │ │ │ ├─ layout-6164ce23b6804195.js
│ │ │ │ │ │ │ ├─ login
│ │ │ │ │ │ │ │ ├─ page-d1c69d9a4fff8c53.js
│ │ │ │ │ │ │ ├─ page-fc7236f98a18e0cd.js
│ │ │ │ │ │ │ ├─ protected
│ │ │ │ │ │ │ │ ├─ page-32ae038e9722b2e2.js
│ │ │ │ │ │ │ ├─ register
│ │ │ │ │ │ │ │ ├─ page-f8d91be4aa39ead7.js
│ │ │ │ │ │ │ ├─ reset-password
│ │ │ │ │ │ │ │ ├─ page-b880d53904b5e09e.js
│ │ │ │ │ │ │ ├─ showcase
│ │ │ │ │ │ │ │ ├─ page-5db3504885c80d91.js
│ │ │ │ │ │ │ ├─ test-llm
│ │ │ │ │ │ │ │ └─ page-f73423ba524e5708.js
│ │ │ │ │ │ ├─ framework-3664cab31236a9fa.js
│ │ │ │ │ │ ├─ main-app-570028990f069aa3.js
│ │ │ │ │ │ ├─ main-cffc4f7c174aa6dc.js
│ │ │ │ │ │ ├─ pages
│ │ │ │ │ │ │ ├─ \_app-10a93ab5b7c32eb3.js
│ │ │ │ │ │ │ ├─ \_error-2d792b2a41857be4.js
│ │ │ │ │ │ ├─ polyfills-42372ed130431b0a.js
│ │ │ │ │ │ ├─ webpack-56ba36de5726cfbe.js
│ │ │ │ │ ├─ css
│ │ │ │ │ │ ├─ 0e6289e10576fb6f.css
│ │ │ │ │ └─ media
│ │ │ │ │ ├─ 26a46d62cd723877-s.woff2
│ │ │ │ │ ├─ 55c55f0601d81cf3-s.woff2
│ │ │ │ │ ├─ 581909926a08bbc8-s.woff2
│ │ │ │ │ ├─ 8e9860b6e62d6359-s.woff2
│ │ │ │ │ ├─ 97e0cb1ae144a2a9-s.woff2
│ │ │ │ │ ├─ df0a9ae256c0569c-s.woff2
│ │ │ │ │ └─ e4af272ccee01ff0-s.p.woff2
│ │ │ ├─ \_routes.json
│ │ │ ├─ \_worker.js
│ │ │ │ ├─ **next-on-pages-dist**
│ │ │ │ │ ├─ cache
│ │ │ │ │ │ ├─ adaptor.js
│ │ │ │ │ │ ├─ cache-api.js
│ │ │ │ │ │ └─ kv.js
│ │ │ │ ├─ index.js
│ │ │ │ ├─ nop-build-log.json
│ │ │ ├─ admin
│ │ │ │ ├─ logs
│ │ │ │ │ ├─ index.html
│ │ │ │ │ └─ index.txt
│ │ │ ├─ auth
│ │ │ │ ├─ github
│ │ │ │ │ ├─ callback
│ │ │ │ │ │ ├─ index.html
│ │ │ │ │ │ └─ index.txt
│ │ │ │ ├─ google
│ │ │ │ │ └─ callback
│ │ │ │ │ ├─ index.html
│ │ │ │ │ └─ index.txt
│ │ │ ├─ cdn-cgi
│ │ │ │ ├─ errors
│ │ │ │ │ └─ no-nodejs_compat.html
│ │ │ ├─ change-password
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ chat
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ debug
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ debug-env
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ dev
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ forgot-password
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ index.html
│ │ │ ├─ index.txt
│ │ │ ├─ login
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ protected
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ register
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ reset-password
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ showcase
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ test-llm
│ │ │ │ ├─ index.html
│ │ │ │ └─ index.txt
│ │ ├─ docs
│ │ │ ├─ chrome-remote-debugging-design.md
│ │ ├─ jest.config.ci.js
│ │ ├─ jest.config.js
│ │ ├─ jest.config.mjs.backup
│ │ ├─ jest.setup.js
│ │ ├─ jest.setup.js.backup
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
│ │ │ ├─ test-utils.tsx
│ │ │ ├─ utils.ts
│ │ │ ├─ version-storage.ts
│ │ │ ├─ version-utils.ts
│ │ ├─ next-env.d.ts
│ │ ├─ next.config.js
│ │ ├─ node_modules
│ │ ├─ out
│ │ │ ├─ 404
│ │ │ │ ├─ index.html
│ │ │ ├─ 404.html
│ │ │ ├─ \_next
│ │ │ │ ├─ build_1754406781555
│ │ │ │ ├─ static
│ │ │ │ │ ├─ build_1754406781555
│ │ │ │ │ │ ├─ \_buildManifest.js
│ │ │ │ │ │ ├─ \_ssgManifest.js
│ │ │ │ │ ├─ chunks
│ │ │ │ │ │ ├─ 108-2bfe596ec743145a.js
│ │ │ │ │ │ ├─ 144.acc1d0e69bebb70f.js
│ │ │ │ │ │ ├─ 1dd3208c-d8805bbe278132e7.js
│ │ │ │ │ │ ├─ 235-a1e3944db67361af.js
│ │ │ │ │ │ ├─ 282-dc4c9c0746343764.js
│ │ │ │ │ │ ├─ 311-b40fe441e6193cdc.js
│ │ │ │ │ │ ├─ 340-78504ce91d8e9728.js
│ │ │ │ │ │ ├─ 38-b16b1c12665b5400.js
│ │ │ │ │ │ ├─ 456-72b03ca6897ad1f5.js
│ │ │ │ │ │ ├─ 528-c00304921a536d22.js
│ │ │ │ │ │ ├─ 540.3a55e6706d0bc17b.js
│ │ │ │ │ │ ├─ 599-491de2b1c0b6a5dc.js
│ │ │ │ │ │ ├─ 627-ab9967a4c39810b1.js
│ │ │ │ │ │ ├─ 684-13a4ccd6ce211593.js
│ │ │ │ │ │ ├─ 692-3561ffd1a7cfe8ea.js
│ │ │ │ │ │ ├─ 831-d6434f9525b9d8f9.js
│ │ │ │ │ │ ├─ app
│ │ │ │ │ │ │ ├─ \_not-found
│ │ │ │ │ │ │ │ ├─ page-d765114ac1af0636.js
│ │ │ │ │ │ │ ├─ auth
│ │ │ │ │ │ │ │ ├─ github
│ │ │ │ │ │ │ │ │ ├─ callback
│ │ │ │ │ │ │ │ │ │ └─ page-461bfc7e9bfa7103.js
│ │ │ │ │ │ │ │ ├─ google
│ │ │ │ │ │ │ │ │ └─ callback
│ │ │ │ │ │ │ │ │ └─ page-fb45421c2e390426.js
│ │ │ │ │ │ │ ├─ change-password
│ │ │ │ │ │ │ │ ├─ page-784688ee4e26c76e.js
│ │ │ │ │ │ │ ├─ chat
│ │ │ │ │ │ │ │ ├─ page-037fb60d9c3e27f3.js
│ │ │ │ │ │ │ ├─ debug
│ │ │ │ │ │ │ │ ├─ page-573d1a47b740d0f0.js
│ │ │ │ │ │ │ ├─ debug-env
│ │ │ │ │ │ │ │ ├─ page-62361f280988f779.js
│ │ │ │ │ │ │ ├─ debug-logs
│ │ │ │ │ │ │ │ ├─ page-79d5d140aa38a88f.js
│ │ │ │ │ │ │ ├─ dev
│ │ │ │ │ │ │ │ ├─ page-55f62f03cb8b7171.js
│ │ │ │ │ │ │ ├─ forgot-password
│ │ │ │ │ │ │ │ ├─ page-db42fe5092551712.js
│ │ │ │ │ │ │ ├─ layout-adcadcd2619a1557.js
│ │ │ │ │ │ │ ├─ login
│ │ │ │ │ │ │ │ ├─ page-13dc6077a73a530b.js
│ │ │ │ │ │ │ ├─ page-0dc4deadaf2f30ed.js
│ │ │ │ │ │ │ ├─ protected
│ │ │ │ │ │ │ │ ├─ page-37db75754cd97d52.js
│ │ │ │ │ │ │ ├─ register
│ │ │ │ │ │ │ │ ├─ page-73ed5f104b5a2101.js
│ │ │ │ │ │ │ ├─ reset-password
│ │ │ │ │ │ │ │ ├─ page-871ac9c076327c2f.js
│ │ │ │ │ │ │ ├─ showcase
│ │ │ │ │ │ │ │ ├─ page-8d08c2ef9bb98a13.js
│ │ │ │ │ │ │ ├─ test-llm
│ │ │ │ │ │ │ │ └─ page-30a618c4c4d11fe2.js
│ │ │ │ │ │ ├─ framework-3664cab31236a9fa.js
│ │ │ │ │ │ ├─ main-55058b6510c3f94d.js
│ │ │ │ │ │ ├─ main-app-570028990f069aa3.js
│ │ │ │ │ │ ├─ pages
│ │ │ │ │ │ │ ├─ \_app-10a93ab5b7c32eb3.js
│ │ │ │ │ │ │ ├─ \_error-2d792b2a41857be4.js
│ │ │ │ │ │ ├─ polyfills-42372ed130431b0a.js
│ │ │ │ │ │ ├─ webpack-01380166e0979198.js
│ │ │ │ │ ├─ css
│ │ │ │ │ │ ├─ 6c90db1dc625fc8d.css
│ │ │ │ │ └─ media
│ │ │ │ │ ├─ 26a46d62cd723877-s.woff2
│ │ │ │ │ ├─ 55c55f0601d81cf3-s.woff2
│ │ │ │ │ ├─ 581909926a08bbc8-s.woff2
│ │ │ │ │ ├─ 8e9860b6e62d6359-s.woff2
│ │ │ │ │ ├─ 97e0cb1ae144a2a9-s.woff2
│ │ │ │ │ ├─ df0a9ae256c0569c-s.woff2
│ │ │ │ │ └─ e4af272ccee01ff0-s.p.woff2
│ │ │ ├─ api
│ │ │ │ ├─ redis-stats
│ │ │ ├─ auth
│ │ │ │ ├─ github
│ │ │ │ │ ├─ callback
│ │ │ │ │ │ ├─ index.html
│ │ │ │ │ │ └─ index.txt
│ │ │ │ ├─ google
│ │ │ │ │ └─ callback
│ │ │ │ │ ├─ index.html
│ │ │ │ │ └─ index.txt
│ │ │ ├─ change-password
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ chat
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ debug
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ debug-env
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ debug-logs
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ dev
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ forgot-password
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ index.html
│ │ │ ├─ index.txt
│ │ │ ├─ login
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ protected
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ register
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ reset-password
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ showcase
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ test-llm
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ version-manifest.json
│ │ ├─ package.json
│ │ ├─ postcss.config.js
│ │ ├─ public
│ │ │ ├─ version-manifest.json
│ │ ├─ tailwind.config.js
│ │ ├─ tsconfig.json
│ │ ├─ tsconfig.src.tsbuildinfo
│ │ ├─ tsconfig.tsbuildinfo
│ │ └─ types
│ │ └─ chat.ts
└─ packages
├─ ui
│ ├─ index.ts
│ ├─ jest.config.js
│ ├─ jest.setup.js
│ ├─ package.json
│ ├─ src
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
│ │ ├─ lib
│ │ │ ├─ utils.ts
│ │ ├─ progress.tsx
│ │ ├─ select.tsx
│ │ ├─ separator.tsx
│ │ ├─ table.tsx
│ │ ├─ tabs.tsx
│ │ ├─ textarea.tsx
│ │ ├─ tooltip.tsx
│ ├─ tsconfig.json
│ ├─ tsconfig.tsbuildinfo
└─ storybook
├─ CLAUDE.md
├─ README.md
├─ index.ts
├─ node_modules
├─ package.json
├─ pnpm-lock.yaml
├─ stories
│ ├─ Button.stories.ts
│ ├─ Button.stories.tsx
│ ├─ Button.tsx
│ ├─ Configure.mdx
│ ├─ Header.stories.ts
│ ├─ Header.tsx
│ ├─ Page.stories.ts
│ ├─ Page.tsx
│ ├─ assets
│ │ ├─ accessibility.png
│ │ ├─ accessibility.svg
│ │ ├─ addon-library.png
│ │ ├─ assets.png
│ │ ├─ avif-test-image.avif
│ │ ├─ context.png
│ │ ├─ discord.svg
│ │ ├─ docs.png
│ │ ├─ figma-plugin.png
│ │ ├─ github.svg
│ │ ├─ share.png
│ │ ├─ styling.png
│ │ ├─ testing.png
│ │ ├─ theming.png
│ │ ├─ tutorials.svg
│ │ ├─ youtube.svg
│ ├─ button.css
│ ├─ header.css
│ ├─ page.css
├─ storybook-static
│ ├─ assets
│ │ ├─ Button-BUWIWcOK.css
│ │ ├─ Button-CkPSLTHp.js
│ │ ├─ Button.stories-BRd6rXl1.js
│ │ ├─ Button.stories-e7uh8BHW.js
│ │ ├─ Color-PRSJMWNM-Bmevy-7Y.js
│ │ ├─ Configure-DizRNU1f.js
│ │ ├─ DocsRenderer-K4EAMTCU-CTa-WsUb.js
│ │ ├─ Header-Cef0XOyq.css
│ │ ├─ Header-wIjOTnGr.js
│ │ ├─ Header.stories-B7derpQN.js
│ │ ├─ Page-Cp-fE8ZV.css
│ │ ├─ Page.stories-CjTlDu3n.js
│ │ ├─ WithTooltip-KJL26V4Q-D0oM_95z.js
│ │ ├─ accessibility-W_h2acOZ.png
│ │ ├─ addon-library-BWUCAmyN.png
│ │ ├─ context-C0qIqeS4.png
│ │ ├─ docs---vsFbMi.png
│ │ ├─ entry-preview-BvErJzwg.js
│ │ ├─ entry-preview-docs-x6BaOJCm.js
│ │ ├─ figma-plugin-CH2hELiO.png
│ │ ├─ formatter-2WMMO6ZP-DN4dIKmr.js
│ │ ├─ iframe-CuAKB7tT.js
│ │ ├─ index-BXzfdmYx.js
│ │ ├─ index-BoGtrjhK.js
│ │ ├─ index-CKgCmmyX.js
│ │ ├─ index-Cu4lwwaE.js
│ │ ├─ index-DrFu-skq.js
│ │ ├─ index-FeUjBnvO.js
│ │ ├─ index-Uned3PQb.js
│ │ ├─ index-uubelm5h.js
│ │ ├─ jsx-runtime-CCjYJYRa.js
│ │ ├─ preview-B4GcaC1c.js
│ │ ├─ preview-BAz7FMXc.js
│ │ ├─ preview-BIpbcxMU.css
│ │ ├─ preview-BJKiUloN.js
│ │ ├─ preview-BpcF_O6y.js
│ │ ├─ preview-CAN9cKVW.js
│ │ ├─ preview-CwqMn10d.js
│ │ ├─ preview-D8JUnPEd.js
│ │ ├─ preview-DIj6ZUOG.js
│ │ ├─ preview-GWuD73zX.js
│ │ ├─ react-18-BmA5Ow4-.js
│ │ ├─ share-DGA-UcQf.png
│ │ ├─ styling-Bk6zjRzU.png
│ │ ├─ syntaxhighlighter-BP7B2CQK-ClfwtLbt.js
│ │ ├─ testing-cbzR9l9r.png
│ │ ├─ theming-D6WJLNoW.png
│ ├─ favicon.svg
│ ├─ iframe.html
│ ├─ index.html
│ ├─ index.json
│ ├─ project.json
│ ├─ sb-addons
│ │ ├─ chromatic-com-storybook-10
│ │ │ ├─ manager-bundle.js
│ │ │ ├─ manager-bundle.js.LEGAL.txt
│ │ ├─ essentials-actions-4
│ │ │ ├─ manager-bundle.js
│ │ │ ├─ manager-bundle.js.LEGAL.txt
│ │ ├─ essentials-backgrounds-5
│ │ │ ├─ manager-bundle.js
│ │ │ ├─ manager-bundle.js.LEGAL.txt
│ │ ├─ essentials-controls-3
│ │ │ ├─ manager-bundle.js
│ │ │ ├─ manager-bundle.js.LEGAL.txt
│ │ ├─ essentials-measure-8
│ │ │ ├─ manager-bundle.js
│ │ │ ├─ manager-bundle.js.LEGAL.txt
│ │ ├─ essentials-outline-9
│ │ │ ├─ manager-bundle.js
│ │ │ ├─ manager-bundle.js.LEGAL.txt
│ │ ├─ essentials-toolbars-7
│ │ │ ├─ manager-bundle.js
│ │ │ ├─ manager-bundle.js.LEGAL.txt
│ │ ├─ essentials-viewport-6
│ │ │ ├─ manager-bundle.js
│ │ │ ├─ manager-bundle.js.LEGAL.txt
│ │ ├─ links-2
│ │ │ ├─ manager-bundle.js
│ │ │ ├─ manager-bundle.js.LEGAL.txt
│ │ ├─ onboarding-1
│ │ │ ├─ manager-bundle.js
│ │ │ ├─ manager-bundle.js.LEGAL.txt
│ │ ├─ storybook-core-server-presets-0
│ │ │ ├─ common-manager-bundle.js
│ │ │ └─ common-manager-bundle.js.LEGAL.txt
│ ├─ sb-common-assets
│ │ ├─ fonts.css
│ │ ├─ nunito-sans-bold-italic.woff2
│ │ ├─ nunito-sans-bold.woff2
│ │ ├─ nunito-sans-italic.woff2
│ │ ├─ nunito-sans-regular.woff2
│ ├─ sb-manager
│ │ ├─ WithTooltip-KJL26V4Q-5LS5AN27.js
│ │ ├─ chunk-2IOEGHGR.js
│ │ ├─ chunk-B3YDJJJH.js
│ │ ├─ chunk-BLWCBWKL.js
│ │ ├─ chunk-GUVK2GTO.js
│ │ ├─ chunk-VQTIH3SE.js
│ │ ├─ chunk-ZR5JZWHI.js
│ │ ├─ formatter-2WMMO6ZP-JI7RHVTW.js
│ │ ├─ globals-module-info.js
│ │ ├─ globals-runtime.js
│ │ ├─ globals.js
│ │ ├─ index.js
│ │ ├─ runtime.js
│ │ ├─ syntaxhighlighter-BP7B2CQK-WOJYHKQR.js
│ ├─ sb-preview
│ │ ├─ globals.js
│ │ └─ runtime.js
├─ storybook.css
├─ tailwind.config.js
└─ tsconfig.json
