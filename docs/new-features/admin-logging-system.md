# Admin Logging System (Story 3.6)

**Epic**: [Epic 3: Resilient Real-time Logging](../template-development/prd/epic-3.md)

## New Features Added

### Redis Data Sync Interface

- View Redis buffer statistics without importing data
- Display log count, active traces, users, and system breakdown
- Show Redis connection status and TTL information

### Selective Data Synchronization

- "Sync All" button to pull all Redis data to Convex
- "Sync by Trace" input for specific trace_id logs
- "Sync by User" input for specific user_id logs
- Progress indicators during sync operations
- Conflict resolution for existing data

### Flat Data Visualization

- Chronological table sorted by timestamp
- Columns: timestamp, system, user, trace_id, level, message
- Expandable rows for detailed log context
- System filtering (browser/convex/worker)
- Search functionality within synced data

### AI-Ready Export System

- Export formats: JSON, structured text, CSV
- Claude-optimized format with context preservation
- Copy-to-clipboard functionality
- Download file options
- Include trace correlation metadata

### Debug Table Management

- New `debug_logs` table in Convex schema
- Cleanup controls (clear all, clear by age, clear by trace)
- Storage usage monitoring
- Data retention settings

## Files Added/Modified

### 🆕 New Backend Files (Convex)

- `apps/convex/workerSync.ts` - Redis sync operations and HTTP actions
- `apps/convex/debugLogs.ts` - Debug table queries and mutations

### 🆕 New Frontend Components (React)

- `apps/web/components/admin/redis-stats-card.tsx` - Redis buffer statistics display
- `apps/web/components/admin/sync-controls-card.tsx` - Data sync controls with progress indicators
- `apps/web/components/admin/debug-logs-table.tsx` - Chronological log visualization with expandable rows
- `apps/web/components/admin/export-controls-card.tsx` - AI-ready export functionality

### 🆕 New API Routes

- `apps/web/app/api/redis-stats/route.ts` - Next.js API route for Worker health stats

### 🆕 New UI Library Components

- `packages/ui/src/table.tsx` - Table component for log display
- `packages/ui/src/textarea.tsx` - Textarea component for export preview
- `packages/ui/src/collapsible.tsx` - Collapsible component for expandable rows

### 📝 Modified Backend Files

- `apps/convex/schema.ts` - Added `debug_logs` table with comprehensive indexes for trace_id, user_id, system, timestamp, synced_at

### 📝 Modified Frontend Files

- `apps/web/app/admin/logs/page.tsx` - Complete rewrite using new component architecture (replaced broken tabs-based interface)

### 📝 Modified Configuration Files

- `packages/ui/index.ts` - Added exports for Table, Textarea, Collapsible components
- `apps/web/next.config.js` - **CRITICAL FIX**: Removed redundant env section that was overriding Next.js automatic NEXT*PUBLIC*\* variable handling

### 📝 Modified Worker Configuration

- `apps/workers/log-ingestion/wrangler.toml` - Added SQLite-based Durable Objects migration for free plan compatibility

## Technical Impact

- **19 files changed**
- **2,554 insertions**
- **Complete admin logs page functionality restored**
- **Redis-to-Convex sync system operational**

## Key Benefits

- Admin page loads without errors (fixed 404)
- Selective data sync from Redis buffer to Convex
- Chronological debugging workflow with expandable details
- AI-optimized export formats for Claude Code analysis
- Clean separation between Redis buffer (volatile) and debug storage (persistent)
