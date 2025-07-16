# Infrastructure and Deployment

The project uses a pragmatic "Infrastructure from Code" approach with GitHub Actions and the Wrangler CLI managing deployments to Cloudflare. It follows a Continuous Deployment model for the `main` branch, with automatic preview deployments for every pull request. Rollbacks are handled via Cloudflare's instant rollback feature.
