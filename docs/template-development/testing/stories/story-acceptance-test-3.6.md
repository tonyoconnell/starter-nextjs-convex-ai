# UAT Plan: Story 3.6 - Redis Data Sync & Legacy Code Migration

## Test Overview

**Story**: Story 3.6 - Redis Data Sync & Legacy Code Migration (Phase 1: Foundation)  
**Test Focus**: Redis-to-Convex sync workflow with new admin dashboard replacing broken legacy components  
**Test Environment**: Development with access to Worker, Redis, and Convex endpoints  
**Estimated Duration**: 1.5-2 hours

## Prerequisites

### Environment Setup

- [ ] Convex development environment running (`bunx convex dev`)
- [ ] Web application accessible (localhost:3000)
- [ ] Cloudflare Worker deployed and accessible
- [ ] Upstash Redis instance with existing log data
- [ ] Environment variables configured:
  - `NEXT_PUBLIC_LOG_WORKER_URL`
  - `NEXT_PUBLIC_CONVEX_URL`
  - Worker secrets: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

### Test Data Requirements

- [ ] Browser with developer tools access
- [ ] Redis instance with existing log entries (at least 10-20 logs)
- [ ] Multiple trace IDs and user IDs in Redis for filtering tests
- [ ] Text editor or note-taking app for export validation

## Test Cases

### TC-01: Admin Page Access and Redis Summary

**Acceptance Criteria**: AC1 - Redis Summary Interface displays statistics without importing data

#### TC-01.1: Admin Page Loading

- [ ] **Action**: Navigate to `http://localhost:3000/admin/logs/`
- [ ] **Expected**: Page loads successfully without 404 error
- [ ] **Verify**: New "Redis Debug Logs Dashboard" interface displays
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-01.2: Redis Stats Card Display

- [ ] **Action**: Observe Redis Stats Card on page load
- [ ] **Expected**: Card shows "Redis Log Buffer Status" with connection status
- [ ] **Verify**: Displays total logs, active traces, unique users, and data age
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-01.3: Redis Connection Status

- [ ] **Action**: Check the connection badge in Redis Stats Card
- [ ] **Expected**: Shows "Connected" (green) or "Error" (red) with appropriate status
- [ ] **Verify**: System breakdown shows logs by source (browser/convex/worker/manual)
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-01.4: Stats Refresh Functionality

- [ ] **Action**: Click refresh button in Redis Stats Card
- [ ] **Expected**: Loading spinner appears, then stats update with "Last updated" timestamp
- [ ] **Verify**: No errors in browser console during refresh
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

### TC-02: Selective Data Sync Controls

**Acceptance Criteria**: AC2 - Sync controls allow pulling all logs or filtering by trace_id, user_id

#### TC-02.1: Sync All Logs

- [ ] **Action**: Click "Sync All" button in Data Sync Controls card
- [ ] **Expected**: Progress indicator shows "Syncing all logs from Redis..."
- [ ] **Verify**: Success message displays total logs synced with timestamp
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-02.2: Sync by Trace ID

- [ ] **Action**: Enter valid trace ID in "Sync by Trace ID" field and click "Sync Trace"
- [ ] **Expected**: Progress shows "Syncing trace [ID]..." then success with count
- [ ] **Verify**: Input field clears on successful sync
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-02.3: Sync by User ID

- [ ] **Action**: Enter valid user ID in "Sync by User ID" field and click "Sync User"
- [ ] **Expected**: Progress shows "Syncing logs for user [ID]..." then success
- [ ] **Verify**: Only logs for specified user are synced
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-02.4: Sync Error Handling

- [ ] **Action**: Attempt sync with invalid/non-existent trace ID
- [ ] **Expected**: Error message displays with details
- [ ] **Verify**: UI remains functional after error (no crashes)
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-02.5: Duplicate Prevention

- [ ] **Action**: Sync the same trace ID twice
- [ ] **Expected**: Second sync updates existing records rather than creating duplicates
- [ ] **Verify**: Total count reflects actual unique logs, not double-counted
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

### TC-03: Flat Data Visualization

**Acceptance Criteria**: AC3 - Simple chronological table view optimized for debugging workflows

#### TC-03.1: Debug Logs Table Display

- [ ] **Action**: Observe Debug Logs Table after syncing data
- [ ] **Expected**: Table shows chronological list with expand/collapse functionality
- [ ] **Verify**: Columns display: timestamp, system, level, user, trace_id, message
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-03.2: Row Expansion

- [ ] **Action**: Click expand arrow (chevron) on any log row
- [ ] **Expected**: Row expands to show full message, context, stack trace if available
- [ ] **Verify**: Metadata shows full trace ID, user ID, original ID, synced timestamp
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-03.3: System Filtering

- [ ] **Action**: Use System dropdown to filter by "browser", "convex", "worker", "manual"
- [ ] **Expected**: Table shows only logs from selected system
- [ ] **Verify**: Filter works correctly and can be cleared
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-03.4: Level Filtering

- [ ] **Action**: Use Level dropdown to filter by "error", "warn", "info", "log"
- [ ] **Expected**: Table shows only logs at selected level
- [ ] **Verify**: Badge colors match level (error=red, warn=orange, etc.)
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-03.5: Search Functionality

- [ ] **Action**: Enter search term in "Search messages..." field
- [ ] **Expected**: Table filters to show only logs containing search term
- [ ] **Verify**: Search works in both message content and context
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-03.6: Trace/User Filtering

- [ ] **Action**: Enter trace ID or user ID in respective filter fields
- [ ] **Expected**: Table shows only logs matching the specified ID
- [ ] **Verify**: Multiple filters can be combined effectively
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-03.7: Clear Filters

- [ ] **Action**: Apply multiple filters, then click "Clear" button
- [ ] **Expected**: All filters reset to default state
- [ ] **Verify**: Table shows all synced logs again
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

### TC-04: AI-Ready Export Functionality

**Acceptance Criteria**: AC4 - One-click export of raw log data for Claude Code consumption

#### TC-04.1: JSON Export

- [ ] **Action**: Select "JSON" format in Export Controls, click "Prepare Export"
- [ ] **Expected**: Preview shows structured JSON with log data
- [ ] **Verify**: Export includes full context, timestamps, and metadata
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-04.2: CSV Export

- [ ] **Action**: Select "CSV" format, prepare export
- [ ] **Expected**: Preview shows comma-separated values with headers
- [ ] **Verify**: Data is properly escaped and formatted for spreadsheet import
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-04.3: Claude-Optimized Text Export

- [ ] **Action**: Select "Text (Claude-optimized)" format, prepare export
- [ ] **Expected**: Preview shows human-readable chronological format
- [ ] **Verify**: Format includes clear trace correlation and timestamps
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-04.4: Copy to Clipboard

- [ ] **Action**: Prepare any export, click "Copy to Clipboard"
- [ ] **Expected**: "Copied!" confirmation appears briefly
- [ ] **Verify**: Paste into text editor shows complete export data
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-04.5: Download File

- [ ] **Action**: Prepare export, click "Download File"
- [ ] **Expected**: Browser downloads file with appropriate extension (.json/.csv/.txt)
- [ ] **Verify**: Downloaded file contains complete export data
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-04.6: Export Filtering

- [ ] **Action**: Set filter to specific trace, prepare export
- [ ] **Expected**: Export contains only logs for specified trace
- [ ] **Verify**: Export metadata shows correct filter applied
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-04.7: Export Limits

- [ ] **Action**: Set export limit (e.g., 50), prepare export with more data available
- [ ] **Expected**: Export contains exactly 50 logs with note about limit
- [ ] **Verify**: Preview shows truncation indicator if applicable
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

### TC-05: Error Handling and Edge Cases

**Acceptance Criteria**: System handles errors gracefully and provides helpful feedback

#### TC-05.1: Worker Unavailable

- [ ] **Action**: Stop Worker service, refresh admin page
- [ ] **Expected**: Redis Stats Card shows "Error" status with helpful message
- [ ] **Verify**: Page remains functional, sync operations show appropriate errors
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-05.2: Empty Redis Data

- [ ] **Action**: Test with Redis instance containing no logs
- [ ] **Expected**: Cards show zero values, table shows "No logs synced yet"
- [ ] **Verify**: All components handle empty state gracefully
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-05.3: Large Dataset Handling

- [ ] **Action**: Test with substantial log data (500+ entries)
- [ ] **Expected**: Interface remains responsive with pagination/loading
- [ ] **Verify**: Sync operations complete within reasonable time
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-05.4: Browser Console Errors

- [ ] **Action**: Throughout all testing, monitor browser developer console
- [ ] **Expected**: No JavaScript errors or warnings (except acceptable console.log)
- [ ] **Verify**: Network requests complete successfully
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

### TC-06: UI/UX Validation

**Acceptance Criteria**: Interface provides good user experience for debugging workflows

#### TC-06.1: Responsive Design

- [ ] **Action**: Test interface on different screen sizes (desktop, tablet-sized window)
- [ ] **Expected**: Components adapt appropriately to screen size
- [ ] **Verify**: Table remains usable on smaller screens
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-06.2: Loading States

- [ ] **Action**: Observe loading states during sync operations
- [ ] **Expected**: Clear loading indicators with appropriate messaging
- [ ] **Verify**: User cannot trigger duplicate operations during loading
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-06.3: Navigation

- [ ] **Action**: Use "← Back to Home" link
- [ ] **Expected**: Returns to main application page
- [ ] **Verify**: Navigation works correctly without page errors
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-06.4: Accessibility

- [ ] **Action**: Test basic keyboard navigation (Tab, Space, Enter)
- [ ] **Expected**: Interactive elements can be accessed via keyboard
- [ ] **Verify**: Screen reader appropriate labels (check with screen reader if available)
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

## Test Results Summary

### Overall Results

- [ ] **All Critical Tests Passed**: ✅ Pass / ❌ Fail
- [ ] **Admin Page Functional**: ✅ Pass / ❌ Fail
- [ ] **Redis Integration Working**: ✅ Pass / ❌ Fail
- [ ] **Sync Operations Reliable**: ✅ Pass / ❌ Fail
- [ ] **Export Functionality Complete**: ✅ Pass / ❌ Fail
- [ ] **Error Handling Robust**: ✅ Pass / ❌ Fail

### Critical Issues Found

1. **Issue**:
   **Severity**: Critical/High/Medium/Low
   **Status**: Open/Resolved

2. **Issue**:
   **Severity**: Critical/High/Medium/Low
   **Status**: Open/Resolved

### Sign-off

- [ ] **Functional Requirements Met**: All acceptance criteria satisfied
- [ ] **User Experience Acceptable**: Interface supports debugging workflow effectively
- [ ] **Performance Acceptable**: Operations complete within reasonable timeframes
- [ ] **Error Handling Sufficient**: System handles failure cases gracefully

**Test Completed By**: ******\_\_\_\_******  
**Date**: ******\_\_\_\_******  
**Overall Result**: ✅ Pass / ❌ Fail  
**Ready for Production**: ✅ Yes / ❌ No

### Notes for Future Phases

**Phase 2 Considerations**:

- Legacy code cleanup requirements identified during testing
- Performance optimization opportunities noted
- Additional export format requests

**Phase 3 Enhancement Ideas**:

- Automated sync scheduling based on testing feedback
- Advanced filtering capabilities suggested by usage patterns
- Integration improvements discovered during UAT

---

**UAT Plan Version**: 1.0  
**Created**: 2025-08-04  
**Story Reference**: docs/template-development/stories/3.6.story.md
