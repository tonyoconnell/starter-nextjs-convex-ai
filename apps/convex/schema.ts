import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // Simple test table to verify Convex connection
  test_messages: defineTable({
    message: v.string(),
    timestamp: v.number(),
  }),

  // User authentication table following architecture/data-models.md
  users: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.string(), // Required password field
    profile_image_url: v.optional(v.string()),
    role: v.string(),
  }).index('by_email', ['email']),

  // BetterAuth sessions table
  sessions: defineTable({
    userId: v.id('users'),
    sessionToken: v.string(),
    expires: v.number(),
  })
    .index('by_session_token', ['sessionToken'])
    .index('by_user_id', ['userId']),

  // BetterAuth accounts table for oauth providers (future use)
  accounts: defineTable({
    userId: v.id('users'),
    type: v.string(),
    provider: v.string(),
    providerAccountId: v.string(),
    refresh_token: v.optional(v.string()),
    access_token: v.optional(v.string()),
    expires_at: v.optional(v.number()),
    token_type: v.optional(v.string()),
    scope: v.optional(v.string()),
    id_token: v.optional(v.string()),
  })
    .index('by_provider_account', ['provider', 'providerAccountId'])
    .index('by_user_id', ['userId']),
});
