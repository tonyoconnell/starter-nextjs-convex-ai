# Epic 3: Resilient Real-time Logging

**Goal:** To implement a developer-first real-time logging system that captures distributed traces across browser, Cloudflare Workers, and Convex backend, optimized for AI agent assistance and debugging workflows, with a clear evolution path to production-grade logging infrastructure.

---

## Story 3.1: Browser Log Capture Foundation

_As a developer, I need a reliable system to capture browser console logs and errors with trace correlation, so that I can debug issues across the entire application stack._

**Acceptance Criteria:**

1.  A console.log override system is implemented that captures all browser console output without interfering with normal logging.
2.  A Convex HTTP Action endpoint is created to receive browser logs directly from the client.
3.  Log correlation system is implemented with trace_id, user_id, and system_area tagging.
4.  A toggleable mechanism allows developers to enable/disable browser log capture as needed.
5.  **Future Enhancement**: Chrome remote debugging infrastructure is designed for comprehensive event capture.

---

## Story 3.2: Multi-System Log Ingestion & Correlation

_As a developer, I want logs from browser, Cloudflare Workers, and Convex backend to be correlated with trace IDs, so that I can follow a complete request flow across all systems._

**Acceptance Criteria:**

1.  The Convex HTTP Action endpoint handles browser console logs with CORS configuration.
2.  Cloudflare Workers logging utilities are enhanced to propagate trace correlation data.
3.  Convex Log Streams webhook integration captures backend function execution logs.
4.  Log ingestion creates entries in both `log_queue` for processing and `recent_log_entries` for real-time viewing.
5.  **Fallback**: Cloudflare Worker proxy is available if direct Convex CORS proves problematic.

---

## Story 3.3: Development-Optimized Log Processing & AI Integration

_As a developer, I want logs to be processed in real-time during development with trace correlation and context enrichment, so that AI agents can provide intelligent debugging assistance._

**Acceptance Criteria:**

1.  A log processing system runs in real-time for development mode (immediate processing).
2.  Trace correlation engine links logs across browser, workers, and Convex using trace_id.
3.  Context enrichment adds user session data, system state, and error patterns to logs.
4.  AI-ready data export generates structured summaries for Claude Code consumption.
5.  **Production Design**: Configuration system designed for batched processing with sampling when production mode is needed.
6.  **Future Enhancement**: Pattern detection identifies common error flows and performance bottlenecks.

---

## Story 3.4: Developer Dashboard & Claude Code Integration

_As a developer, I want a real-time dashboard that shows correlated logs across all systems with AI-powered insights, so that I can quickly identify and resolve issues during development._

**Acceptance Criteria:**

1.  The `/logs` page displays real-time correlated logs from browser, workers, and Convex with trace timeline visualization.
2.  Console logging status indicator shows current capture state with toggle controls.
3.  Trace viewer displays complete request flows across system boundaries with performance timing.
4.  Claude Code integration endpoints provide structured log context for AI debugging assistance.
5.  **Future Enhancement**: Chrome remote debugging mode provides comprehensive browser event capture with DevTools Protocol integration.
6.  **Developer Experience**: Error correlation alerts and pattern detection help identify issues proactively.
