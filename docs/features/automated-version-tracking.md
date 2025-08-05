# Automated Version Display & History System

## Feature Overview

The Automated Version Display & History System provides comprehensive version tracking and display capabilities for web applications, automatically incrementing versions based on conventional commit patterns and displaying version history to authorized users.

## Key Features

### 1. Automated Version Increment

- **Conventional Commit Parsing**: Automatically analyzes commit messages (feat:, fix:, docs:, etc.)
- **Semantic Versioning**: Increments major.minor.patch based on commit types
- **CI/CD Integration**: Updates version manifest during successful deployments
- **GitHub Integration**: Direct links to commit URLs for easy reference

### 2. Version Manifest System

- **Machine-Readable Format**: JSON file containing version history and metadata
- **Static Asset Delivery**: Served as public asset for client-side access
- **Historical Analysis**: Bootstrap script analyzes existing commit history
- **Configurable Depth**: Customizable number of versions to track

### 3. UI Display Components

- **Footer Indicator**: Compact version display with click-to-expand functionality
- **Version History Modal**: Shows last 20 versions with navigation controls
- **Flash Notifications**: Prominent but non-intrusive new version alerts
- **GitHub Integration**: Direct links to commits and change details

### 4. Access Control

- **Owner-Only Visibility**: Version display restricted to specific email addresses
- **Convex Authentication**: Integrated with existing auth system
- **Graceful Degradation**: Hidden from unauthorized users without errors

### 5. New Version Detection

- **Local Storage Tracking**: Remembers user's last seen version
- **Flash Notification**: Automatic alerts for new deployments
- **Persistence Control**: Prevents repeated flashing for same version
- **Auto-Hide**: Configurable timeout for notification dismissal

### 6. Visual Prominence System

- **Pulsating Indicator**: Version indicator displays with bright yellow background when new version is deployed
- **User Acknowledgment**: Clicking the prominent indicator dismisses the visual prominence
- **Persistent Prominence**: Visual prominence persists across page refreshes until user acknowledges
- **Smart Detection**: Automatically detects new versions and triggers prominence state
- **Local Storage Integration**: Tracks acknowledgment state to prevent re-showing for same version

## Technical Architecture

### Core Components

#### Backend Components

- **Bootstrap Script** (`scripts/bootstrap-version-history.sh`)
  - Analyzes git history using conventional commit patterns
  - Generates semantic versions for historical commits
  - Creates initial version manifest with configurable depth
  - Repository-agnostic design for template reuse

- **Version Increment Script** (`scripts/version-increment.sh`)
  - CI/CD integration for automatic version updates
  - Conventional commit message parsing
  - Version manifest updates during deployments
  - GitHub Actions integration with output variables

- **Convex Auth Function** (`apps/convex/auth.ts`)
  - Owner access verification for version visibility
  - Email-based access control (david@ideasmen.com.au)
  - Session-based authentication integration

#### Frontend Components

- **Version Utilities** (`apps/web/lib/version-utils.ts`)
  - Version manifest fetching and validation
  - Semantic version comparison and sorting
  - Version navigation logic
  - Formatting and display helpers

- **Version Storage** (`apps/web/lib/version-storage.ts`)
  - Local storage management for version tracking
  - New version detection logic
  - Flash notification persistence
  - **Visual prominence tracking** with acknowledgment state
  - **Smart prominence detection** based on version changes
  - SSR-safe browser compatibility
  - Backward compatibility for storage schema updates

- **Version Flash Notification** (`apps/web/components/dev/version-flash-notification.tsx`)
  - Animated flash notification for new versions
  - Auto-hide functionality with configurable timing
  - Commit type and increment type display
  - View details and GitHub link integration

- **Version Indicator** (`apps/web/components/dev/version-indicator.tsx`)
  - Compact footer indicator with version display
  - **Visual prominence system** with pulsating yellow background
  - **User acknowledgment handling** with click interaction
  - Expandable version history modal
  - Previous/Next navigation controls
  - **Dynamic tooltip content** based on prominence state
  - Loading states and error handling
  - Conditional styling based on acknowledgment state

- **Version Provider** (`apps/web/components/dev/version-provider.tsx`)
  - React context for version system integration
  - Centralized state management
  - Component coordination and communication
  - Hooks for easy consumption

### Data Flow

```
Git Commit → CI/CD Pipeline → Version Increment → Manifest Update → Client Fetch → UI Display
     ↓              ↓              ↓              ↓             ↓            ↓
Conventional   GitHub Actions   Semantic Ver   Static Asset   Local Store   Flash/Modal
Commit Parse   Triggers         Calculation    Generation     Comparison    Display
```

## Template Reusability

### Configuration Points

#### 1. Owner Email Configuration

```typescript
// In apps/convex/auth.ts
const ownerEmail = 'david@ideasmen.com.au'; // Change to your email
```

#### 2. Version Configuration

```json
// In scripts/version-config.json
{
  "depth": 50,
  "startingVersion": "0.1.0",
  "description": "Version bootstrap configuration"
}
```

#### 3. CI/CD Integration

```yaml
# In .github/workflows/ci.yml
- name: Increment version after successful deployment
  id: version
  run: |
    chmod +x ./scripts/version-increment.sh
    ./scripts/version-increment.sh "${{ github.sha }}" "${{ github.event.head_commit.message }}"
```

#### 4. Component Integration

```tsx
// In your app layout
import { VersionProvider } from '@/components/dev/version-provider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <VersionProvider
          showIndicator={true}
          showFlashNotifications={true}
          indicatorPosition="bottom-right"
          maxVersions={20}
        >
          {children}
        </VersionProvider>
      </body>
    </html>
  );
}
```

### Migration Guide

#### Step 1: Copy Core Files

Copy these files to your target repository:

- `scripts/bootstrap-version-history.sh`
- `scripts/version-increment.sh`
- `scripts/version-config.json`
- `apps/web/lib/version-utils.ts`
- `apps/web/lib/version-storage.ts`
- `apps/web/components/dev/version-flash-notification.tsx`
- `apps/web/components/dev/version-indicator.tsx`
- `apps/web/components/dev/version-provider.tsx`

#### Step 2: Update Convex Auth

Add the `verifyOwnerAccess` function to your Convex auth module:

```typescript
export const verifyOwnerAccess = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx: QueryCtx, args: { sessionToken?: string }) => {
    // Implementation from apps/convex/auth.ts
  },
});
```

#### Step 3: Configure CI/CD Pipeline

Update your GitHub Actions workflow:

- Add version increment step after successful deployment
- Set up permissions for contents: write
- Install jq dependency
- Add git configuration for automated commits

#### Step 4: Bootstrap Version History

Run the bootstrap script to generate initial version manifest:

```bash
./scripts/bootstrap-version-history.sh
```

#### Step 5: Integrate Components

Add the VersionProvider to your application layout and configure access control.

### Customization Options

#### UI Customization

- **Position**: Configure indicator position (bottom-left, bottom-right, top-left, top-right)
- **Styling**: Custom className for component styling
- **Max Versions**: Configurable number of versions to display
- **Auto-Hide**: Customizable flash notification timing

#### Access Control

- **Email-Based**: Restrict access to specific email addresses
- **Role-Based**: Extend to use role-based access control
- **Environment-Based**: Different access rules for different environments

#### Data Management

- **Version Depth**: Configure how many historical versions to track
- **Starting Version**: Set initial version for new repositories
- **Commit Types**: Customize version increment rules for different commit types

## Testing Strategy

### Test Coverage

- **Unit Tests**: Version utilities, storage operations, component behavior
- **Integration Tests**: Complete user workflows and system interactions
- **Access Control Tests**: Authentication and authorization scenarios
- **Error Handling Tests**: Network failures, invalid data, edge cases

### Test Files

- `tests/web/lib/version-utils.test.ts` - Utility function testing
- `tests/web/lib/version-storage.test.ts` - Storage and localStorage testing
- `tests/web/components/dev/version-flash-notification.test.tsx` - Flash notification testing
- `tests/web/components/dev/version-indicator.test.tsx` - Version indicator testing
- `tests/web/components/dev/version-provider.test.tsx` - Provider context testing
- `tests/web/integration/version-tracking.test.ts` - End-to-end integration testing
- `tests/convex/auth-owner-access.test.ts` - Convex auth function testing

## Performance Considerations

### Optimization Strategies

- **Lazy Loading**: Version history modal loads only when expanded
- **Caching**: Version data cached appropriately to prevent excessive API calls
- **Bundle Size**: Minimal impact on application bundle size
- **Local Storage**: Optimized for frequent access patterns

### Resource Usage

- **Version Manifest**: Limited to 20 versions to control file size
- **Flash Notifications**: Minimal performance impact on page load
- **Static Assets**: Served efficiently via CDN/static hosting
- **Memory Usage**: Efficient local storage operations

## Security Considerations

### Access Control

- **Email Verification**: Strict email-based access control
- **Session Validation**: Proper session token verification
- **Error Handling**: No information leakage in error messages
- **Input Validation**: Proper validation of version data and parameters

### Data Privacy

- **No Sensitive Data**: Version manifest contains only public commit information
- **Local Storage**: Version tracking data is non-sensitive
- **Authentication**: Leverages existing secure authentication system
- **API Security**: Proper error handling without exposing system details

## Monitoring and Maintenance

### Health Checks

- **Manifest Validation**: Automatic validation of version manifest structure
- **Access Logs**: Security monitoring for access control events
- **Error Tracking**: Comprehensive error handling and reporting
- **Performance Monitoring**: Tracking of component load times and interactions

### Maintenance Tasks

- **Version Cleanup**: Automatic limitation to last 20 versions
- **Storage Management**: Local storage cleanup and migration
- **CI/CD Monitoring**: Ensure version increment scripts work correctly
- **Access Control Review**: Periodic review of authorized users

## Integration Examples

### Next.js Integration

```tsx
// pages/_app.tsx or app/layout.tsx
import { VersionProvider } from '@/components/dev/version-provider';

export default function App({ Component, pageProps }) {
  return (
    <VersionProvider
      showIndicator={process.env.NODE_ENV === 'production'}
      indicatorPosition="bottom-right"
    >
      <Component {...pageProps} />
    </VersionProvider>
  );
}
```

### Environment-Based Configuration

```tsx
const versionConfig = {
  showIndicator: process.env.NODE_ENV === 'production',
  showFlashNotifications: process.env.ENABLE_VERSION_NOTIFICATIONS === 'true',
  maxVersions: parseInt(process.env.MAX_VERSION_HISTORY || '20'),
};
```

### Custom Styling

```tsx
<VersionProvider
  className="custom-version-theme"
  indicatorPosition="bottom-left"
  showIndicator={true}
  showFlashNotifications={true}
/>
```

## Troubleshooting

### Common Issues

#### Version Manifest Not Loading

- Verify file exists at `/public/version-manifest.json`
- Check static asset serving configuration
- Validate JSON structure with `./scripts/version-increment.sh --validate`

**Solution Pattern**:

```bash
# Check manifest exists and is valid JSON
ls -la apps/web/public/version-manifest.json
jq empty apps/web/public/version-manifest.json
```

#### Flash Notifications Not Showing

- Verify localStorage is available and writable
- Check browser console for JavaScript errors
- Ensure user has proper access permissions
- Verify visual prominence state hasn't been acknowledged

**Debug Pattern**:

```javascript
// Check localStorage state in browser console
JSON.parse(localStorage.getItem('version-tracking') || '{}');

// Reset prominence state for testing
localStorage.removeItem('version-tracking');
```

#### CI/CD Version Updates Failing

**Critical JSON Injection Fix**: The version increment script was vulnerable to JSON injection when commit messages contained special characters, line breaks, or emojis.

**Symptoms**:

- `jq: invalid JSON text passed to --argjson` error in CI logs
- Version increment script failing with exit code 2
- Deployments succeeding but version manifest not updating

**Root Cause**: Commit messages with special characters breaking JSON parsing:

```bash
# Problematic pattern (vulnerable to injection)
new_version_entry=$(cat << EOF
{
  "description": "$commit_message"  # ← Line breaks/quotes break JSON
}
EOF
)
jq --argjson new_entry "$new_version_entry" ...
```

**Solution Applied**: Secure jq argument passing with message sanitization:

```bash
# Secure pattern (prevents injection)
clean_message=$(echo "$commit_message" | tr -d '\r\n\t' | head -c 500)
jq --arg description "$clean_message" \
   '.versions = [{
     "description": $description  # ← Safe argument passing
   }] + .versions ...' "$MANIFEST_FILE"
```

**Prevention Checklist**:

- ✅ Sanitize commit messages by removing control characters
- ✅ Use jq argument passing (`--arg`) instead of string interpolation
- ✅ Limit message length to prevent excessive data
- ✅ Test with various commit message formats including emojis

#### Missing Dependencies Issues

**Radix UI Components Missing**: Development server may fail with module resolution errors.

**Symptoms**:

```
Module not found: Can't resolve '@radix-ui/react-separator'
Module not found: Can't resolve '@radix-ui/react-tooltip'
```

**Solution**:

```bash
# Install missing Radix UI dependencies
cd packages/ui
bun add @radix-ui/react-separator@1.1.7
bun add @radix-ui/react-tooltip@1.2.7
```

**Prevention**: Always verify UI package dependencies when using new Radix components.

#### Import Path Resolution Errors

**Symptoms**: Build compilation errors with "Module not found" for UI components.

**Common Anti-Pattern**:

```typescript
// ❌ Wrong - causes build failures
import { Button } from '@/components/ui/button';
```

**Correct Pattern**:

```typescript
// ✅ Correct - follows project conventions
import { Button } from '@starter/ui';
```

**Solution Checklist**:

- Follow CLAUDE.md import path guidelines
- Use configured aliases: `@starter/ui`, `@/lib/*`, `@/components/*`
- Check `tsconfig.json` path mappings for reference
- Avoid relative imports like `../../../../apps/`

#### Access Control Issues

- Verify email configuration matches user's authenticated email
- Check Convex auth system integration
- Validate session token handling
- Ensure user has owner-level access

**Debug Pattern**:

```typescript
// Check auth state in browser console
const { sessionToken } = useAuth();
console.log('Session token:', sessionToken);

// Verify owner access response
const ownerAccess = useQuery(api.auth.verifyOwnerAccess, { sessionToken });
console.log('Owner access:', ownerAccess);
```

#### Visual Prominence Not Working

**Symptoms**: Version indicator not showing pulsating yellow background for new versions.

**Debug Checklist**:

- Check if indicator has been acknowledged: `shouldShowProminentIndicator(currentVersion)`
- Verify local storage state for acknowledgment tracking
- Ensure `isProminent` state is being updated correctly
- Test with fresh browser session to reset acknowledgment state

**Reset Pattern**:

```javascript
// Reset prominence state for testing
localStorage.removeItem('version-tracking');
location.reload();
```

### CI/CD Pipeline Debugging

#### GitHub Actions Environment Issues

**Symptoms**: Scripts failing in CI but working locally.

**Common Causes**:

- Missing environment variables in GitHub Secrets
- Different shell behavior in CI environment
- Git configuration missing for automated commits
- jq not installed in CI runner

**Solution Pattern**:

```yaml
# Ensure proper CI environment setup
- name: Install dependencies
  run: |
    sudo apt-get update
    sudo apt-get install -y jq

- name: Configure git
  run: |
    git config --global user.name "GitHub Actions"
    git config --global user.email "actions@github.com"

- name: Set script permissions
  run: chmod +x ./scripts/version-increment.sh
```

#### Script Validation Commands

**Pre-deployment Validation**:

```bash
# Validate script syntax
bash -n ./scripts/version-increment.sh

# Test with sample data
./scripts/version-increment.sh --validate

# Check current version
./scripts/version-increment.sh --current

# Test increment with safe message
./scripts/version-increment.sh "abc123" "feat: test message"
```

### Security Considerations

#### JSON Injection Prevention

**Critical Security Pattern**: Always sanitize user input before JSON operations.

**Vulnerability Pattern** (DO NOT USE):

```bash
# ❌ VULNERABLE - allows JSON injection
user_input="$1"
json_data="{\"message\": \"$user_input\"}"
jq --argjson data "$json_data" ...
```

**Secure Pattern** (USE THIS):

```bash
# ✅ SECURE - prevents injection
user_input="$1"
clean_input=$(echo "$user_input" | tr -d '\r\n\t' | head -c 500)
jq --arg message "$clean_input" '{"message": $message}' ...
```

**Security Checklist**:

- ✅ Always use jq argument passing (`--arg`, `--argjson` with pre-constructed JSON)
- ✅ Sanitize input by removing control characters
- ✅ Limit input length to prevent DoS
- ✅ Never interpolate user input directly into JSON strings
- ✅ Test with malicious input: `'"; rm -rf /; echo "'`, `\n\r\t`, etc.

#### Access Control Security

**Email-Based Access Control**:

- Store owner emails in secure configuration
- Validate email format and existence
- Use session-based authentication
- Implement proper error handling without information leakage

**Local Storage Security**:

- Only store non-sensitive version tracking data
- Implement data validation on retrieval
- Handle malformed data gracefully
- Clear sensitive data on logout

### Debug Tools

- **Version Storage Stats**: `getVersionStorageStats()` function for debugging
- **Manifest Validation**: Built-in validation with detailed error messages
- **Console Logging**: Comprehensive logging for development debugging
- **Error Boundaries**: Graceful error handling in React components
- **Script Validation**: `./scripts/version-increment.sh --validate` for manifest integrity
- **CI Debug Mode**: Enable verbose logging in GitHub Actions for troubleshooting

## Future Enhancements

### Potential Features

- **Multi-User Access**: Role-based access control for teams
- **Version Comparison**: Diff view between versions
- **Release Notes**: Automated generation from commit messages
- **Deployment Status**: Integration with deployment pipeline status
- **Performance Metrics**: Version performance tracking and analytics

### Integration Opportunities

- **Slack Notifications**: Automated notifications to team channels
- **Email Notifications**: Digest emails for version updates
- **Analytics Integration**: Usage tracking and user behavior analysis
- **Documentation Integration**: Automatic documentation updates

## Conclusion

The Automated Version Display & History System provides a comprehensive, reusable solution for version tracking and display in web applications. With its focus on automation, security, and user experience, it serves as a valuable template component that can be easily adapted to different projects and requirements.

The system's modular architecture, comprehensive testing, and detailed documentation make it an excellent candidate for template reuse across multiple applications and teams.
