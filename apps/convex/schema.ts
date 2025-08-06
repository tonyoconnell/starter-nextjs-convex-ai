import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * Convex Database Schema - Starter Next.js Template
 *
 * This schema defines the data model for a multi-layer AI-first application template.
 * Architecture: Next.js frontend + Convex backend + Cloudflare Workers + AI integration
 *
 * Key Design Patterns:
 * - BetterAuth integration for authentication
 * - Hybrid vector storage (Convex + Cloudflare Vectorize)
 * - Comprehensive logging and debugging infrastructure
 * - Real-time chat and messaging capabilities
 * - Knowledge ingestion and AI-powered search
 *
 * @relationships See relationship documentation in data-models.md
 * @indexes Optimized for common access patterns
 * @ai_context Structured for AI agent understanding and code generation
 */
export default defineSchema({
  // =============================================================================
  // TESTING & DEVELOPMENT TABLES
  // =============================================================================

  /**
   * @table test_messages
   * @purpose Connection testing and development verification
   * @access_pattern Development and debugging only
   * @lifecycle Temporary - can be removed in production
   */
  test_messages: defineTable({
    /** Simple test message content */
    message: v.string(),
    /** Unix timestamp for message creation */
    timestamp: v.number(),
  }),

  // =============================================================================
  // AUTHENTICATION & USER MANAGEMENT
  // =============================================================================

  /**
   * @table users
   * @purpose Core user authentication and profile management
   * @auth_integration BetterAuth with Convex adapter
   * @relationships
   *   - one-to-many: sessions (userId)
   *   - one-to-many: accounts (userId)
   *   - one-to-many: chat_sessions (userId)
   *   - one-to-many: chat_messages (userId)
   *   - one-to-many: password_reset_tokens (userId)
   * @access_patterns
   *   - Authentication: lookup by email for login
   *   - Profile management: CRUD operations for user data
   *   - Authorization: role-based access control
   *   - AI access: LLM feature gating per user
   * @security PII data - handle with encryption and privacy compliance
   */
  users: defineTable({
    /** User's display name for UI presentation */
    name: v.string(),
    /** Unique email address for authentication
     *  @validation Email format required
     *  @security PII - encrypted storage recommended */
    email: v.string(),
    /** Hashed password for email/password authentication
     *  @security Bcrypt hashed, never store plaintext */
    password: v.string(),
    /** Optional profile avatar URL
     *  @format URL string or null
     *  @storage External URL (not stored in Convex) */
    profile_image_url: v.optional(v.string()),
    /** User role for authorization
     *  @values "user", "admin", "moderator"
     *  @default "user" */
    role: v.string(),
    /** Feature flag for LLM/AI access
     *  @purpose Cost control and feature gating
     *  @default false for new users */
    hasLLMAccess: v.optional(v.boolean()),
  }).index('by_email', ['email']),

  /**
   * @table sessions
   * @purpose BetterAuth session management for persistent login
   * @auth_integration BetterAuth session tracking
   * @relationships
   *   - many-to-one: users (userId)
   * @access_patterns
   *   - Session validation: lookup by sessionToken for auth middleware
   *   - User session management: queries by userId for admin operations
   *   - Session cleanup: queries by expires for maintenance
   * @lifecycle Auto-cleanup on expiration
   */
  sessions: defineTable({
    /** Reference to the authenticated user
     *  @foreign_key users._id */
    userId: v.id('users'),
    /** Unique session identifier for authentication
     *  @format Random secure token
     *  @security High entropy, cryptographically secure */
    sessionToken: v.string(),
    /** Session expiration timestamp
     *  @format Unix timestamp
     *  @lifecycle Auto-cleanup after expiration */
    expires: v.number(),
    /** Optional persistent session flag
     *  @purpose "Remember me" functionality
     *  @effect Extends session duration */
    rememberMe: v.optional(v.boolean()),
  })
    .index('by_session_token', ['sessionToken'])
    .index('by_user_id', ['userId']),

  /**
   * @table accounts
   * @purpose OAuth provider account linking for BetterAuth
   * @auth_integration Social login providers (GitHub, Google, etc.)
   * @relationships
   *   - many-to-one: users (userId)
   * @access_patterns
   *   - OAuth linking: lookup by provider + providerAccountId
   *   - User account management: queries by userId
   * @status Future use - OAuth integration planned
   */
  accounts: defineTable({
    /** Reference to the linked user account
     *  @foreign_key users._id */
    userId: v.id('users'),
    /** OAuth account type identifier
     *  @values "oauth", "email" */
    type: v.string(),
    /** OAuth provider identifier
     *  @values "github", "google", "discord", etc. */
    provider: v.string(),
    /** Provider's unique account identifier
     *  @format Provider-specific ID string */
    providerAccountId: v.string(),
    /** OAuth refresh token for token renewal
     *  @security Encrypted storage recommended */
    refresh_token: v.optional(v.string()),
    /** OAuth access token for API calls
     *  @security Encrypted storage recommended
     *  @lifecycle Short-lived, refreshable */
    access_token: v.optional(v.string()),
    /** Access token expiration timestamp
     *  @format Unix timestamp */
    expires_at: v.optional(v.number()),
    /** OAuth token type
     *  @values "Bearer", "token" */
    token_type: v.optional(v.string()),
    /** OAuth scope permissions granted
     *  @format Space-separated scope list */
    scope: v.optional(v.string()),
    /** OpenID Connect ID token
     *  @format JWT token with user claims */
    id_token: v.optional(v.string()),
  })
    .index('by_provider_account', ['provider', 'providerAccountId'])
    .index('by_user_id', ['userId']),

  /**
   * @table password_reset_tokens
   * @purpose Secure password reset workflow
   * @auth_integration Password reset email flow
   * @relationships
   *   - many-to-one: users (userId)
   * @access_patterns
   *   - Token validation: lookup by token for reset verification
   *   - User reset history: queries by userId for security monitoring
   * @security Time-limited tokens, single-use recommended
   * @lifecycle Auto-cleanup on expiration
   */
  password_reset_tokens: defineTable({
    /** Reference to user requesting password reset
     *  @foreign_key users._id */
    userId: v.id('users'),
    /** Secure reset token sent via email
     *  @format Random secure token (UUID or similar)
     *  @security High entropy, single-use */
    token: v.string(),
    /** Token expiration timestamp
     *  @format Unix timestamp
     *  @duration Typically 1-24 hours
     *  @lifecycle Auto-cleanup after expiration */
    expires: v.number(),
  })
    .index('by_token', ['token'])
    .index('by_user_id', ['userId']),

  // =============================================================================
  // LOGGING & DEBUGGING INFRASTRUCTURE
  // =============================================================================

  /**
   * @table debug_logs
   * @purpose Centralized debug logging for multi-tier application debugging
   * @architecture Redis → Convex sync for persistent log analysis
   * @relationships None (standalone logging table)
   * @access_patterns
   *   - Trace correlation: lookup by trace_id for request tracking
   *   - User debugging: queries by user_id for user-specific issues
   *   - System analysis: queries by system for component-level debugging
   *   - Temporal analysis: queries by timestamp for time-based investigation
   *   - Sync monitoring: queries by synced_at for data pipeline health
   * @data_flow Cloudflare Worker → Redis Buffer → Convex Sync → Dashboard
   * @volume_management Cost-aware with cleanup strategies for log retention
   */
  debug_logs: defineTable({
    /** Original log entry ID from Redis buffer
     *  @format Redis-generated unique identifier
     *  @purpose Maintains traceability from source */
    id: v.string(),
    /** Correlation ID for request/session tracking
     *  @format UUID or session-specific identifier
     *  @purpose Cross-system request correlation */
    trace_id: v.string(),
    /** Optional user context for authenticated logs
     *  @format User ID string (not foreign key - allows system logs)
     *  @nullable System and worker logs may not have user context */
    user_id: v.optional(v.string()),
    /** Log source system identifier
     *  @values "browser", "convex", "worker", "manual"
     *  @purpose Component-level log categorization */
    system: v.union(
      v.literal('browser'),
      v.literal('convex'),
      v.literal('worker'),
      v.literal('manual')
    ),
    /** Log severity level
     *  @values "log", "info", "warn", "error"
     *  @purpose Filtering and alerting based on severity */
    level: v.union(
      v.literal('log'),
      v.literal('info'),
      v.literal('warn'),
      v.literal('error')
    ),
    /** Human-readable log message
     *  @format Plain text or structured message
     *  @indexing Searchable for debugging queries */
    message: v.string(),
    /** Log event timestamp
     *  @format Unix timestamp from original event
     *  @purpose Temporal correlation and chronological analysis */
    timestamp: v.number(),
    /** Optional structured context data
     *  @format JSON object with event-specific data
     *  @purpose Rich debugging context (request data, state, etc.) */
    context: v.optional(v.any()),
    /** Optional error stack trace
     *  @format String stack trace for error-level logs
     *  @purpose Detailed error debugging and root cause analysis */
    stack: v.optional(v.string()),
    /** Complete original log entry from Redis
     *  @format Full JSON object as received from worker
     *  @purpose Audit trail and debugging of log processing pipeline */
    raw_data: v.any(),
    /** Sync timestamp from Redis to Convex
     *  @format Unix timestamp when synced to Convex
     *  @purpose Data pipeline monitoring and sync delay analysis */
    synced_at: v.number(),
  })
    .index('by_trace_id', ['trace_id'])
    .index('by_user_id', ['user_id'])
    .index('by_system', ['system'])
    .index('by_timestamp', ['timestamp'])
    .index('by_synced_at', ['synced_at']),

  /**
   * @deprecated_tables Logging Infrastructure Evolution
   * @migration_note Old logging tables removed - now handled by Cloudflare Worker + Redis
   *
   * Migrated tables (now in Redis):
   * - log_queue: Real-time log buffering moved to Redis for cost efficiency
   * - recent_log_entries: Fast recent log access now served from Redis cache
   * - rate_limit_state: Rate limiting state moved to Durable Objects
   * - message_fingerprints: Deduplication logic moved to worker layer
   *
   * @benefits Cost reduction, improved performance, better scalability
   * @architecture Workers → Redis → Convex (async sync) → Dashboard
   */

  // =============================================================================
  // CHAT & CONVERSATION SYSTEM
  // =============================================================================

  /**
   * @table chat_sessions
   * @purpose Conversation session management for AI chat interface
   * @relationships
   *   - many-to-one: users (userId)
   *   - one-to-many: chat_messages (sessionId)
   * @access_patterns
   *   - User conversations: queries by userId for user's chat history
   *   - Session management: CRUD operations for conversation lifecycle
   *   - Correlation tracking: lookup by correlation_id for debugging
   * @ui_integration Conversation sidebar, session persistence
   * @ai_context Multi-turn conversation context management
   */
  chat_sessions: defineTable({
    /** Reference to the session owner
     *  @foreign_key users._id
     *  @purpose User-scoped conversation organization */
    userId: v.id('users'),
    /** Optional conversation title for UI display
     *  @format Auto-generated from first message or user-provided
     *  @nullable Defaults to timestamp-based title if not set */
    title: v.optional(v.string()),
    /** Session creation timestamp
     *  @format Unix timestamp
     *  @purpose Chronological ordering and lifecycle management */
    created_at: v.number(),
    /** Last activity timestamp for session prioritization
     *  @format Unix timestamp
     *  @purpose Recent conversation sorting and cleanup */
    updated_at: v.number(),
    /** Request correlation ID for debugging
     *  @format UUID or session-specific identifier
     *  @purpose Cross-system request tracing and log correlation */
    correlation_id: v.string(),
  })
    .index('by_user_id', ['userId'])
    .index('by_correlation_id', ['correlation_id']),

  /**
   * @table chat_messages
   * @purpose Individual messages within conversation sessions
   * @relationships
   *   - many-to-one: chat_sessions (sessionId)
   *   - many-to-one: users (userId) [denormalized for efficiency]
   * @access_patterns
   *   - Conversation display: queries by sessionId for message history
   *   - User message analysis: queries by userId for user behavior analytics
   *   - Performance monitoring: queries by correlation_id for request tracking
   * @ai_integration LLM request/response pairs with usage tracking
   * @cost_management Token usage tracking for billing and limits
   */
  chat_messages: defineTable({
    /** Reference to parent conversation session
     *  @foreign_key chat_sessions._id */
    sessionId: v.id('chat_sessions'),
    /** Reference to message author (denormalized)
     *  @foreign_key users._id
     *  @denormalized Improves query performance for user-scoped operations */
    userId: v.id('users'),
    /** Message author role in conversation
     *  @values "user", "assistant"
     *  @purpose Conversation flow and UI rendering */
    role: v.union(v.literal('user'), v.literal('assistant')),
    /** Message text content
     *  @format Markdown-supported text for rich formatting
     *  @indexing Searchable for conversation search features */
    content: v.string(),
    /** Message creation timestamp
     *  @format Unix timestamp
     *  @purpose Message ordering and temporal analysis */
    timestamp: v.number(),
    /** Request correlation ID for debugging
     *  @format UUID matching session correlation
     *  @purpose End-to-end request tracing */
    correlation_id: v.string(),
    /** AI model identifier for assistant messages
     *  @format Model name (e.g., "gpt-4", "claude-3")
     *  @nullable Only set for assistant messages with LLM access */
    model_used: v.optional(v.string()),
    /** Token consumption for cost tracking
     *  @format Integer token count
     *  @nullable Only set for LLM-generated assistant messages */
    tokens_used: v.optional(v.number()),
    /** Flag indicating if message used LLM or fallback
     *  @purpose Cost analysis and feature usage tracking
     *  @values true: LLM used, false: fallback/cached response */
    has_llm_access: v.boolean(),
  })
    .index('by_session_id', ['sessionId'])
    .index('by_correlation_id', ['correlation_id']),

  // =============================================================================
  // KNOWLEDGE INGESTION & VECTOR SEARCH SYSTEM
  // =============================================================================

  /**
   * @table document_chunks
   * @purpose Text chunks with vector embeddings for AI-powered semantic search
   * @architecture Hybrid: Metadata in Convex + Vector embeddings in Cloudflare Vectorize
   * @relationships
   *   - many-to-one: source_documents (source_document → file_path)
   * @access_patterns
   *   - Content retrieval: queries by vectorize_id for search result assembly
   *   - Source analysis: queries by source_document for document-level operations
   *   - Deduplication: queries by chunk_hash for change detection
   * @vector_integration Cloudflare Vectorize for 1536-dim embeddings (OpenAI text-embedding-3-small)
   * @cost_optimization Hash-based deduplication prevents redundant vector storage
   */
  document_chunks: defineTable({
    /** Reference to parent source document
     *  @reference source_documents.file_path
     *  @format Relative file path from project root */
    source_document: v.string(),
    /** Sequential chunk position within source document
     *  @format Zero-based integer index
     *  @purpose Chunk ordering and reassembly */
    chunk_index: v.number(),
    /** Text content of the chunk for retrieval
     *  @format Plain text extracted from source
     *  @purpose Full-text search and context assembly */
    content: v.string(),
    /** SHA-256 hash of chunk content for deduplication
     *  @format 64-character hex string
     *  @purpose Change detection and duplicate prevention */
    chunk_hash: v.string(),
    /** Unique identifier in Cloudflare Vectorize
     *  @format Short hash + chunk index (max 64 bytes for Vectorize)
     *  @example "a1b2c3d4e5f6g7h8_c0"
     *  @purpose Vector-to-content mapping */
    vectorize_id: v.string(),
    /** Rich metadata for chunk context and debugging */
    metadata: v.object({
      /** Source file path for reference */
      file_path: v.string(),
      /** File type for processing context */
      file_type: v.string(),
      /** Source file modification timestamp */
      modified_at: v.number(),
      /** Chunk size in characters for analytics */
      chunk_size: v.number(),
    }),
    /** Chunk creation timestamp
     *  @format Unix timestamp */
    created_at: v.number(),
    /** Processing correlation ID for debugging
     *  @format UUID for end-to-end tracing */
    correlation_id: v.string(),
  })
    .index('by_source_document', ['source_document'])
    .index('by_chunk_hash', ['chunk_hash'])
    .index('by_vectorize_id', ['vectorize_id']),

  /**
   * @table source_documents
   * @purpose Document metadata and processing state management
   * @relationships
   *   - one-to-many: document_chunks (file_path → source_document)
   * @access_patterns
   *   - Change detection: queries by content_hash for incremental processing
   *   - File management: queries by file_path for document lifecycle
   *   - Status monitoring: queries by processing_status for pipeline health
   * @processing_pipeline Document ingestion → chunking → embedding → indexing
   * @change_detection SHA-256 hash-based processing only when content changes
   */
  source_documents: defineTable({
    /** Unique file path identifier (relative to project root)
     *  @format Relative file path string
     *  @unique Primary document identifier
     *  @example "docs/api/authentication.md" */
    file_path: v.string(),
    /** Document file type for processing strategy
     *  @values "markdown", "typescript", "javascript", "txt", etc.
     *  @purpose Type-specific chunking and processing logic */
    file_type: v.string(),
    /** SHA-256 hash of document content for change detection
     *  @format 64-character hex string
     *  @purpose Incremental processing - only reprocess when changed */
    content_hash: v.string(),
    /** Last successful processing timestamp
     *  @format Unix timestamp
     *  @purpose Processing history and staleness detection */
    last_processed: v.number(),
    /** Total number of chunks generated from document
     *  @format Integer count
     *  @purpose Processing verification and analytics */
    chunk_count: v.number(),
    /** Current processing status
     *  @values "pending", "processing", "completed", "failed"
     *  @purpose Pipeline monitoring and error handling */
    processing_status: v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('failed')
    ),
    /** Error message for failed processing
     *  @format Error string with failure details
     *  @nullable Only populated on processing failure */
    error_message: v.optional(v.string()),
    /** Processing correlation ID for debugging
     *  @format UUID for end-to-end processing trace */
    correlation_id: v.string(),
  })
    .index('by_file_path', ['file_path'])
    .index('by_content_hash', ['content_hash'])
    .index('by_processing_status', ['processing_status']),
});
