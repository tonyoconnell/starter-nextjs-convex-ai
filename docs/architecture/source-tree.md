# Source Tree

```plaintext
/
├── .github/
│   └── workflows/
│       └── ci.yml           # GitHub Actions for CI/CD
├── apps/
│   ├── web/                 # The Next.js frontend application
│   ├── workers/             # Cloudflare Workers for Edge API
│   └── convex/              # Our Convex backend app
│       ├── schema.ts
│       ├── queries.ts
│       └── ...
├── packages/
│   ├── ui/                  # Our shared, reusable UI component library
│   ├── config/              # Shared configurations (ESLint, TSConfig)
│   ├── data-access/         # Implementation of the Repository Pattern
│   ├── storybook/           # The Storybook environment
│   └── shared-types/        # Shared TypeScript types
└── docs/
    └── ...
├── package.json
├── turbo.json
└── bun.lockb
```
