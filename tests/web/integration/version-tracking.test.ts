/**
 * Integration tests for the complete version tracking system
 * Tests end-to-end workflows, component integration, and real-world scenarios
 */

import * as versionUtils from '@/lib/version-utils';
import * as versionStorage from '@/lib/version-storage';

// Mock fetch for version manifest
global.fetch = jest.fn();

describe('Version Tracking System Integration', () => {
  const mockVersionManifest = {
    versions: [
      {
        version: '1.3.0',
        commitHash: 'abc123def456',
        timestamp: 1641081600,
        description: 'feat: major new feature release',
        commitUrl: 'https://github.com/owner/repo/commit/abc123def456',
      },
      {
        version: '1.2.3',
        commitHash: 'def456ghi789',
        timestamp: 1640995200,
        description: 'fix: critical bug fix',
        commitUrl: 'https://github.com/owner/repo/commit/def456ghi789',
      },
      {
        version: '1.2.2',
        commitHash: 'ghi789jkl012',
        timestamp: 1640908800,
        description: 'feat: add user preferences',
        commitUrl: 'https://github.com/owner/repo/commit/ghi789jkl012',
      },
    ],
    current: '1.3.0',
    lastUpdated: 1641081600,
  };

  // Mock localStorage
  const mockLocalStorage = {
    store: new Map<string, string>(),
    getItem: jest.fn((key: string) => mockLocalStorage.store.get(key) || null),
    setItem: jest.fn((key: string, value: string) => {
      mockLocalStorage.store.set(key, value);
    }),
    removeItem: jest.fn((key: string) => {
      mockLocalStorage.store.delete(key);
    }),
    clear: jest.fn(() => {
      mockLocalStorage.store.clear();
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.store.clear();

    // Mock window and localStorage
    (global as any).window = { localStorage: mockLocalStorage };
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Mock successful fetch by default
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockVersionManifest),
    } as any);
  });

  afterEach(() => {
    delete (global as any).window;
  });

  describe('New User Workflow', () => {
    it('should handle first-time user visiting the site', async () => {
      // Simulate first visit - no storage data
      const versionCheck = versionStorage.checkForNewVersion('1.3.0');

      expect(versionCheck).toEqual({
        hasNewVersion: false,
        previousVersion: null,
        shouldShowFlash: false,
      });

      // Should initialize storage
      const storageData = versionStorage.getVersionStorageData();
      expect(storageData).toEqual({
        lastSeenVersion: '1.3.0',
        lastChecked: expect.any(Number),
        flashNotificationShown: false,
      });
    });

    it('should fetch and validate version manifest for new user', async () => {
      const manifestResponse = await versionUtils.fetchVersionManifest();

      expect(manifestResponse.success).toBe(true);
      expect(manifestResponse.data).toEqual(mockVersionManifest);

      // Should validate the manifest structure
      const validation =
        versionUtils.validateVersionManifest(mockVersionManifest);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Version Update Workflow', () => {
    beforeEach(() => {
      // Simulate existing user with older version
      const existingData = {
        lastSeenVersion: '1.2.2',
        lastChecked: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
        flashNotificationShown: false,
      };
      mockLocalStorage.store.set(
        'version-tracking',
        JSON.stringify(existingData)
      );
    });

    it('should detect new version and show flash notification', async () => {
      const versionCheck = versionStorage.checkForNewVersion('1.3.0');

      expect(versionCheck).toEqual({
        hasNewVersion: true,
        previousVersion: '1.2.2',
        shouldShowFlash: true,
      });
    });

    it('should handle complete version update workflow', async () => {
      // 1. Check for new version
      const versionCheck = versionStorage.checkForNewVersion('1.3.0');
      expect(versionCheck.shouldShowFlash).toBe(true);

      // 2. Fetch version manifest
      const manifestResponse = await versionUtils.fetchVersionManifest();
      expect(manifestResponse.success).toBe(true);

      // 3. Extract version information
      const currentVersion = manifestResponse.data!.versions.find(
        v => v.version === '1.3.0'
      );
      expect(currentVersion).toBeDefined();
      expect(currentVersion!.description).toBe(
        'feat: major new feature release'
      );

      // 4. Determine increment type
      const incrementType = versionUtils.getVersionIncrementType(
        '1.2.2',
        '1.3.0'
      );
      expect(incrementType).toBe('minor');

      // 5. Mark flash as shown (simulating notification display)
      const flashResult = versionStorage.markFlashNotificationShown();
      expect(flashResult).toBe(true);

      // 6. Verify flash won't show again until version changes
      const recheckResult = versionStorage.checkForNewVersion('1.3.0');
      expect(recheckResult.shouldShowFlash).toBe(false);

      // 7. Mark version as seen (simulating user dismissal)
      const seenResult = versionStorage.markVersionAsSeen('1.3.0');
      expect(seenResult).toBe(true);

      // 8. Verify storage state
      const finalState = versionStorage.getVersionStorageData();
      expect(finalState).toEqual({
        lastSeenVersion: '1.3.0',
        lastChecked: expect.any(Number),
        flashNotificationShown: false, // Reset for future versions
      });
    });

    it('should handle version history navigation', () => {
      const sortedVersions = versionUtils.sortVersionsDescending(
        mockVersionManifest.versions
      );
      expect(sortedVersions.map(v => v.version)).toEqual([
        '1.3.0',
        '1.2.3',
        '1.2.2',
      ]);

      // Test navigation for current version (newest)
      const currentNav = versionUtils.getVersionNavigation(
        sortedVersions,
        '1.3.0'
      );
      expect(currentNav).toEqual({
        current: sortedVersions[0],
        next: undefined, // No newer version
        previous: sortedVersions[1],
        currentIndex: 0,
      });

      // Test navigation for middle version
      const middleNav = versionUtils.getVersionNavigation(
        sortedVersions,
        '1.2.3'
      );
      expect(middleNav).toEqual({
        current: sortedVersions[1],
        next: sortedVersions[0],
        previous: sortedVersions[2],
        currentIndex: 1,
      });

      // Test navigation for oldest version
      const oldestNav = versionUtils.getVersionNavigation(
        sortedVersions,
        '1.2.2'
      );
      expect(oldestNav).toEqual({
        current: sortedVersions[2],
        next: sortedVersions[1],
        previous: undefined, // No older version
        currentIndex: 2,
      });
    });
  });

  describe('Error Handling Workflows', () => {
    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
        new Error('Network connection failed')
      );

      const manifestResponse = await versionUtils.fetchVersionManifest();

      expect(manifestResponse.success).toBe(false);
      expect(manifestResponse.error).toBe(
        'Error fetching version manifest: Network connection failed'
      );

      // System should continue to work with existing data
      const versionCheck = versionStorage.checkForNewVersion('1.3.0');
      expect(versionCheck).toBeDefined();
    });

    it('should handle invalid manifest data', async () => {
      const invalidManifest = {
        versions: 'not-an-array',
        current: 123,
        lastUpdated: 'invalid',
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(invalidManifest),
      } as any);

      const manifestResponse = await versionUtils.fetchVersionManifest();

      expect(manifestResponse.success).toBe(false);
      expect(manifestResponse.error).toContain('Invalid version manifest');
    });

    it('should handle localStorage errors gracefully', () => {
      const error = new Error('Storage quota exceeded');
      mockLocalStorage.setItem.mockImplementation(() => {
        throw error;
      });

      const data = {
        lastSeenVersion: '1.3.0',
        lastChecked: Date.now(),
        flashNotificationShown: false,
      };

      const result = versionStorage.saveVersionStorageData(data);
      expect(result).toBe(false);
    });

    it('should handle corrupted storage data', () => {
      // Simulate corrupted JSON
      mockLocalStorage.store.set('version-tracking', '{invalid-json');

      const result = versionStorage.getVersionStorageData();
      expect(result).toBeNull();
    });
  });

  describe('Performance and Caching', () => {
    it('should respect cache refresh intervals', () => {
      const existingData = {
        lastSeenVersion: '1.3.0',
        lastChecked: Date.now() - 3 * 60 * 1000, // 3 minutes ago
        flashNotificationShown: false,
      };
      mockLocalStorage.store.set(
        'version-tracking',
        JSON.stringify(existingData)
      );

      // Should not refresh if within 5 minute window
      const shouldRefresh5Min = versionStorage.shouldRefreshVersionData(
        5 * 60 * 1000
      );
      expect(shouldRefresh5Min).toBe(false);

      // Should refresh if outside 2 minute window
      const shouldRefresh2Min = versionStorage.shouldRefreshVersionData(
        2 * 60 * 1000
      );
      expect(shouldRefresh2Min).toBe(true);
    });

    it('should optimize storage operations', () => {
      // Initialize storage
      versionStorage.initializeVersionStorage('1.3.0');
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);

      // Update timestamp only
      versionStorage.updateLastCheckedTimestamp();
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2);

      // Mark flash shown
      versionStorage.markFlashNotificationShown();
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(3);

      // Each operation should preserve existing data
      const finalData = versionStorage.getVersionStorageData();
      expect(finalData?.lastSeenVersion).toBe('1.3.0');
    });
  });

  describe('Version Comparison and Sorting', () => {
    it('should handle complex version comparisons', () => {
      const testVersions = [
        '1.0.0',
        '1.0.1',
        '1.1.0',
        '1.1.1-alpha',
        '1.1.1',
        '2.0.0-beta',
        '2.0.0',
        '10.0.0',
      ];

      // Test individual comparisons
      expect(versionUtils.compareVersions('1.0.1', '1.0.0')).toBeGreaterThan(0);
      expect(versionUtils.compareVersions('1.1.0', '1.0.1')).toBeGreaterThan(0);
      expect(versionUtils.compareVersions('2.0.0', '1.1.1')).toBeGreaterThan(0);
      expect(versionUtils.compareVersions('10.0.0', '2.0.0')).toBeGreaterThan(
        0
      );
      expect(versionUtils.compareVersions('1.1.1-alpha', '1.1.1')).toBeLessThan(
        0
      );

      // Test semantic version validation
      testVersions.forEach(version => {
        expect(versionUtils.isValidSemanticVersion(version)).toBe(true);
      });

      // Test invalid versions
      const invalidVersions = ['1', '1.2', '1.2.3.4', 'invalid', ''];
      invalidVersions.forEach(version => {
        expect(versionUtils.isValidSemanticVersion(version)).toBe(false);
      });
    });

    it('should handle version increment detection accurately', () => {
      const incrementTests = [
        { from: '1.0.0', to: '2.0.0', expected: 'major' },
        { from: '1.0.0', to: '1.1.0', expected: 'minor' },
        { from: '1.0.0', to: '1.0.1', expected: 'patch' },
        { from: '1.2.3', to: '1.2.3', expected: 'unknown' }, // Same version
        { from: '2.0.0', to: '1.0.0', expected: 'unknown' }, // Downgrade
      ];

      incrementTests.forEach(({ from, to, expected }) => {
        expect(versionUtils.getVersionIncrementType(from, to)).toBe(expected);
      });
    });
  });

  describe('Utility Functions', () => {
    beforeEach(() => {
      // Mock Date.now for consistent testing
      jest.spyOn(Date, 'now').mockReturnValue(1641081600000); // 2022-01-02 00:00:00 UTC
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should format timestamps correctly', () => {
      const timestamp = 1640995200; // 2022-01-01 00:00:00 UTC
      const formatted = versionUtils.formatTimestamp(timestamp);
      expect(formatted).toContain('2022');
    });

    it('should format relative times correctly', () => {
      const testCases = [
        { secondsAgo: 30, expected: 'Just now' },
        { secondsAgo: 5 * 60, expected: '5 minutes ago' },
        { secondsAgo: 60, expected: '1 minute ago' },
        { secondsAgo: 2 * 60 * 60, expected: '2 hours ago' },
        { secondsAgo: 60 * 60, expected: '1 hour ago' },
        { secondsAgo: 2 * 24 * 60 * 60, expected: '2 days ago' },
        { secondsAgo: 24 * 60 * 60, expected: '1 day ago' },
      ];

      testCases.forEach(({ secondsAgo, expected }) => {
        const timestamp = Math.floor(Date.now() / 1000) - secondsAgo;
        expect(versionUtils.formatRelativeTime(timestamp)).toBe(expected);
      });

      // Test fallback for old dates (> 7 days)
      const oldTimestamp = Math.floor(Date.now() / 1000) - 8 * 24 * 60 * 60;
      const oldResult = versionUtils.formatRelativeTime(oldTimestamp);
      expect(oldResult).not.toContain('ago');
    });

    it('should extract commit types correctly', () => {
      const commitTests = [
        { message: 'feat: add new feature', expected: 'feat' },
        { message: 'fix: resolve bug', expected: 'fix' },
        { message: 'docs: update documentation', expected: 'docs' },
        { message: 'feat(auth): add login', expected: 'feat' },
        { message: 'fix(ui): button styling', expected: 'fix' },
        { message: 'Add new feature', expected: 'other' },
        { message: 'Update README', expected: 'other' },
        { message: '', expected: 'other' },
      ];

      commitTests.forEach(({ message, expected }) => {
        expect(versionUtils.extractCommitType(message)).toBe(expected);
      });
    });

    it('should truncate strings appropriately', () => {
      const longHash = 'abcdef1234567890abcdef1234567890';
      expect(versionUtils.truncateCommitHash(longHash)).toBe('abcdef12');
      expect(versionUtils.truncateCommitHash(longHash, 12)).toBe(
        'abcdef123456'
      );

      const longMessage =
        'This is a very long commit message that needs to be truncated';
      expect(versionUtils.truncateCommitMessage(longMessage, 30)).toBe(
        'This is a very long commit...'
      );
      expect(versionUtils.truncateCommitMessage('Short', 30)).toBe('Short');
    });
  });

  describe('Storage Statistics and Debugging', () => {
    it('should provide comprehensive storage statistics', () => {
      // No data initially
      const emptyStats = versionStorage.getVersionStorageStats();
      expect(emptyStats).toEqual({ hasStoredData: false });

      // Add some data
      const testData = {
        lastSeenVersion: '1.3.0',
        lastChecked: 1641081600000,
        flashNotificationShown: true,
      };
      versionStorage.saveVersionStorageData(testData);

      // Get stats with data
      const stats = versionStorage.getVersionStorageStats();
      expect(stats).toEqual({
        hasStoredData: true,
        lastSeenVersion: '1.3.0',
        lastChecked: 1641081600000,
        timeSinceLastCheck: expect.any(Number),
        flashNotificationShown: true,
      });
    });

    it('should handle legacy migration', () => {
      // Simulate legacy data
      mockLocalStorage.store.set('version-flash-shown', 'true');

      const result = versionStorage.migrateLegacyVersionStorage();
      expect(result).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'version-flash-shown'
      );
    });

    it('should provide debugging information', () => {
      const existingData = {
        lastSeenVersion: '1.2.3',
        lastChecked: Date.now() - 30 * 60 * 1000, // 30 minutes ago
        flashNotificationShown: false,
      };
      versionStorage.saveVersionStorageData(existingData);

      // Time since last check
      const timeSince = versionStorage.getTimeSinceLastCheck();
      expect(timeSince).toBeGreaterThan(0);
      expect(timeSince).toBeLessThan(60 * 60 * 1000); // Less than 1 hour

      // Should refresh check
      const shouldRefresh = versionStorage.shouldRefreshVersionData(
        15 * 60 * 1000
      ); // 15 min threshold
      expect(shouldRefresh).toBe(true);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle rapid successive version updates', async () => {
      // Start with version 1.2.0
      versionStorage.initializeVersionStorage('1.2.0');

      // Update to 1.2.1
      let versionCheck = versionStorage.checkForNewVersion('1.2.1');
      expect(versionCheck.shouldShowFlash).toBe(true);
      versionStorage.markFlashNotificationShown();
      versionStorage.markVersionAsSeen('1.2.1');

      // Update to 1.2.2 shortly after
      versionCheck = versionStorage.checkForNewVersion('1.2.2');
      expect(versionCheck.shouldShowFlash).toBe(true);
      expect(versionCheck.previousVersion).toBe('1.2.1');

      // Each version should be properly tracked
      const stats = versionStorage.getVersionStorageStats();
      expect(stats.lastSeenVersion).toBe('1.2.1');
    });

    it('should handle browser storage limitations', () => {
      // Simulate storage quota exceeded
      let callCount = 0;
      mockLocalStorage.setItem.mockImplementation(() => {
        callCount++;
        if (callCount > 3) {
          throw new Error('QuotaExceededError');
        }
      });

      // First few operations should succeed
      expect(versionStorage.initializeVersionStorage('1.3.0')).toEqual(
        expect.any(Object)
      );
      expect(versionStorage.markFlashNotificationShown()).toBe(true);
      expect(versionStorage.updateLastCheckedTimestamp()).toBe(true);

      // Fourth operation should fail gracefully
      expect(versionStorage.markVersionAsSeen('1.3.1')).toBe(false);
    });

    it('should handle concurrent version checks', () => {
      const existingData = {
        lastSeenVersion: '1.2.3',
        lastChecked: Date.now() - 10 * 60 * 1000, // 10 minutes ago
        flashNotificationShown: false,
      };
      versionStorage.saveVersionStorageData(existingData);

      // Multiple concurrent checks should return consistent results
      const check1 = versionStorage.checkForNewVersion('1.3.0');
      const check2 = versionStorage.checkForNewVersion('1.3.0');
      const check3 = versionStorage.checkForNewVersion('1.3.0');

      expect(check1).toEqual(check2);
      expect(check2).toEqual(check3);

      // All should detect the new version
      expect(check1.hasNewVersion).toBe(true);
      expect(check1.shouldShowFlash).toBe(true);
    });

    it('should maintain data consistency across page reloads', () => {
      // Simulate first page load
      versionStorage.initializeVersionStorage('1.3.0');
      versionStorage.markFlashNotificationShown();

      // Get the stored state
      const beforeReload = versionStorage.getVersionStorageData();
      expect(beforeReload?.flashNotificationShown).toBe(true);

      // Simulate page reload by creating fresh storage instance
      // (localStorage persists)
      const afterReload = versionStorage.getVersionStorageData();
      expect(afterReload).toEqual(beforeReload);

      // New version check after reload should respect flash shown state
      const versionCheck = versionStorage.checkForNewVersion('1.3.0');
      expect(versionCheck.shouldShowFlash).toBe(false);
    });
  });
});
