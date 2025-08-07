# Deployment Files

> **Generated:** 2025-08-07 02:11:43 UTC  
> **Source:** gpt_context.rb dynamic analysis  
> **Description:** All deployment-related configurations

---

├─ apps
│ ├─ workers
│ │ └─ log-ingestion
│ │ ├─ wrangler.toml
│ │ └─ wrangler.toml.example
├─ .github
│ ├─ workflows
│ │ └─ ci.yml
├─ docs
│ ├─ examples
│ │ ├─ cicd-deployment
│ │ │ ├─ cloudflare-pages-github-actions.md
│ │ ├─ cloudflare-pages-deployment
│ ├─ technical-guides
│ │ ├─ cloudflare-pages-deployment-troubleshooting.md
│ │ ├─ cloudflare-pages-setup.md
│ │ ├─ cloudflare-vectorize-setup.md
│ ├─ architecture
│ │ ├─ source-tree
│ │ │ └─ deployment-files.md
│ ├─ lessons-learned
│ │ └─ anti-patterns
│ │ └─ deployment-anti-patterns.md
└─ scripts
├─ deploy-worker.sh
├─ add-knowledge.sh
├─ bootstrap-version-history.sh
├─ ci-monitor.sh
├─ ci-status.sh
├─ cleanup-logs.sh
├─ debug-env-build.cjs
├─ grant-llm-access.sh
├─ llm-files
├─ migrate-logging-cleanup.sh
├─ seed-knowledge.cjs
├─ smart-push.sh
├─ sync-env.js
├─ sync.sh
├─ test-uat-4.2.sh
├─ version-config.json
└─ version-increment.sh
