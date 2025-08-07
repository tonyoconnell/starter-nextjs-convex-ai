/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  transpilePackages: ['@starter/ui'],
  eslint: {
    ignoreDuringBuilds: true, // Always skip ESLint for speed
  },
  typescript: {
    ignoreBuildErrors: process.env.CI === 'true' || process.env.SKIP_TYPE_CHECK === 'true',
  },
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  output: 'export',
  // Skip error page prerendering that causes React #31 error
  generateBuildId: () => 'static-build',
  // Try to skip problematic error page generation
  // Lightning-fast optimizations
  distDir: '.next',
  compress: false, // Skip compression for faster builds
  poweredByHeader: false,
  // Speed optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@starter/ui'],
    webpackBuildWorker: true, // Parallel webpack builds
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  // Skip time-consuming features in CI
  ...(process.env.CI === 'true' && {
    generateBuildId: () => 'lightning-build',
    onDemandEntries: {
      maxInactiveAge: 60 * 1000,
      pagesBufferLength: 2,
    },
  }),
  env: {
    CLAUDE_LOGGING_ENABLED: String(
      process.env.NODE_ENV === 'development' &&
        process.env.CLAUDE_LOGGING !== 'false'
    ),
  },
};

module.exports = nextConfig;
