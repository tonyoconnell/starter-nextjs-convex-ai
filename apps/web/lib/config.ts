// Centralized configuration to satisfy ESLint no-restricted-syntax rule
export const config = {
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
} as const;