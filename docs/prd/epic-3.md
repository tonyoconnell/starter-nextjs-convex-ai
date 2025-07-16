# Epic 3: Resilient Real-time Logging

**Goal:** To implement a resilient, real-time "Live Log Stream" feature by creating a log buffer pattern that prevents system overload and manages costs, while providing a useful observability tool.

---
## Story 3.1: Define Log Queue & Cache Schemas
*As a developer, I need schemas for both a raw log queue and a temporary real-time cache, so that we can decouple log ingestion from processing.*

**Acceptance Criteria:**
1.  A `log_queue` table is defined in the Convex schema to act as the initial buffer for all incoming log events.
2.  The `recent_log_entries` table (for the UI) is defined with a Time-To-Live (TTL) index configured to automatically delete documents after 60 minutes.
3.  A scheduled function is created to periodically purge any logs older than the TTL as a failsafe mechanism.

---
## Story 3.2: Implement Log Ingestion/Enqueue Mutation
*As a developer, I want a fast, lightweight mutation to enqueue incoming log events, so that log producers (client, server) can fire events without waiting for processing.*

**Acceptance Criteria:**
1.  A Convex mutation `log:enqueue` is created.
2.  Its only responsibility is to write a raw log document to the `log_queue` table.
3.  The client-side and server-side logging utilities are updated to call this `log:enqueue` mutation.

---
## Story 3.3: Build the Batch Processing & Sampling Agent
*As an architect, I want a scheduled backend agent that processes the log queue in batches, so that we can apply cost-saving logic like deduplication and sampling.*

**Acceptance Criteria:**
1.  A scheduled Convex **action** `log:processQueue` is created to run every 10-15 seconds.
2.  The action reads all new documents from the `log_queue`.
3.  It includes logic to deduplicate identical messages within the batch.
4.  It includes basic sampling logic (e.g., process all `ERROR` logs, but only 20% of `INFO` logs).
5.  The processed batch is sent to Logflare for long-term storage.
6.  The processed batch is also written to the `recent_log_entries` table for the UI.
7.  Successfully processed logs are deleted from the `log_queue`.

---
## Story 3.4: Build the Real-time Log Stream UI
*As a user, I want to see a live stream of the *processed* log events, so that I can observe the system's real-time activity.*

**Acceptance Criteria:**
1.  The `/logs` page is built to query the `recent_log_entries` table.
2.  The UI updates in real-time as the `log:processQueue` agent adds new entries to the table.
3.  The UI correctly displays aggregated logs (e.g., `(x100) Error: Failed to connect...`).
4.  A disclaimer is present on the UI explaining it shows a temporary, real-time view of recent events.