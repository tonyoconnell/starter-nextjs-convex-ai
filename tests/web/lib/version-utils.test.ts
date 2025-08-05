/**
 * Comprehensive test suite for version utilities
 * Tests version manifest handling, validation, parsing, and utility functions
 */

import {
  fetchVersionManifest,
  validateVersionManifest,
  validateVersionEntry,
  isValidSemanticVersion,
  compareVersions,
  sortVersionsDescending,
  sortVersionsAscending,
  findVersionEntry,
  getVersionNavigation,
  formatTimestamp,
  formatRelativeTime,
  extractCommitType,
  getVersionIncrementType,
  truncateCommitHash,
  truncateCommitMessage,
  type VersionEntry,
  type VersionManifest,
} from '@/lib/version-utils';

// Mock fetch globally
global.fetch = jest.fn();

describe('Version Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock
    (global.fetch as jest.MockedFunction<typeof fetch>).mockReset();
  });

  describe('fetchVersionManifest', () => {
    const mockManifest: VersionManifest = {
      versions: [
        {
          version: '1.2.3',
          commitHash: 'abc123def456',
          timestamp: 1640995200,
          description: 'feat: add new feature',
          commitUrl: 'https://github.com/owner/repo/commit/abc123def456',
        },
      ],
      current: '1.2.3',
      lastUpdated: 1640995200,
    };

    it('should successfully fetch and validate version manifest', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockManifest),
      };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        mockResponse as any
      );

      const result = await fetchVersionManifest();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockManifest);
      expect(result.error).toBeUndefined();
      expect(fetch).toHaveBeenCalledWith('/version-manifest.json', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
    });

    it('should handle HTTP error responses', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
      };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        mockResponse as any
      );

      const result = await fetchVersionManifest();

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Failed to fetch version manifest: 404 Not Found'
      );
      expect(result.data).toBeUndefined();
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
        new Error('Network error')
      );

      const result = await fetchVersionManifest();

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Error fetching version manifest: Network error'
      );
      expect(result.data).toBeUndefined();
    });

    it('should handle invalid manifest data', async () => {
      const invalidManifest = {
        versions: 'not-an-array',
        current: '1.2.3',
        lastUpdated: 1640995200,
      };
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(invalidManifest),
      };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        mockResponse as any
      );

      const result = await fetchVersionManifest();

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'Invalid version manifest: Versions is not an array'
      );
      expect(result.data).toBeUndefined();
    });

    it('should handle non-Error exceptions', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
        'String error'
      );

      const result = await fetchVersionManifest();

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Error fetching version manifest: Unknown error'
      );
    });
  });

  describe('validateVersionManifest', () => {
    it('should validate a correct manifest', () => {
      const validManifest = {
        versions: [
          {
            version: '1.2.3',
            commitHash: 'abc123',
            timestamp: 1640995200,
            description: 'Test commit',
            commitUrl: 'https://github.com/test/repo/commit/abc123',
          },
        ],
        current: '1.2.3',
        lastUpdated: 1640995200,
      };

      const result = validateVersionManifest(validManifest);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject null/undefined manifests', () => {
      expect(validateVersionManifest(null).isValid).toBe(false);
      expect(validateVersionManifest(undefined).isValid).toBe(false);
      expect(validateVersionManifest('string').isValid).toBe(false);
    });

    it('should reject manifest with invalid versions array', () => {
      const invalidManifest = {
        versions: 'not-an-array',
        current: '1.2.3',
        lastUpdated: 1640995200,
      };

      const result = validateVersionManifest(invalidManifest);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Versions is not an array');
    });

    it('should reject manifest with invalid current version', () => {
      const invalidManifest = {
        versions: [],
        current: 123,
        lastUpdated: 1640995200,
      };

      const result = validateVersionManifest(invalidManifest);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Current version is not a string');
    });

    it('should reject manifest with invalid lastUpdated', () => {
      const invalidManifest = {
        versions: [],
        current: '1.2.3',
        lastUpdated: 'not-a-number',
      };

      const result = validateVersionManifest(invalidManifest);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Last updated is not a number');
    });

    it('should validate individual version entries', () => {
      const manifestWithInvalidEntry = {
        versions: [
          {
            version: 'invalid-version',
            commitHash: 'abc123',
            timestamp: 1640995200,
            description: 'Test commit',
            commitUrl: 'https://github.com/test/repo/commit/abc123',
          },
        ],
        current: '1.2.3',
        lastUpdated: 1640995200,
      };

      const result = validateVersionManifest(manifestWithInvalidEntry);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid semantic version format');
    });
  });

  describe('validateVersionEntry', () => {
    const validEntry = {
      version: '1.2.3',
      commitHash: 'abc123',
      timestamp: 1640995200,
      description: 'Test commit',
      commitUrl: 'https://github.com/test/repo/commit/abc123',
    };

    it('should validate a correct version entry', () => {
      const result = validateVersionEntry(validEntry);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject null/undefined entries', () => {
      expect(validateVersionEntry(null).isValid).toBe(false);
      expect(validateVersionEntry(undefined).isValid).toBe(false);
      expect(validateVersionEntry('string').isValid).toBe(false);
    });

    it('should validate individual fields', () => {
      const fields = ['version', 'commitHash', 'description', 'commitUrl'];
      fields.forEach(field => {
        const invalidEntry = { ...validEntry, [field]: 123 };
        const result = validateVersionEntry(invalidEntry, 0);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain(
          `Version entry 0: ${field.charAt(0).toUpperCase() + field.slice(1)}`
        );
      });
    });

    it('should validate timestamp as number', () => {
      const invalidEntry = { ...validEntry, timestamp: 'not-a-number' };
      const result = validateVersionEntry(invalidEntry);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Timestamp is not a number');
    });

    it('should validate semantic version format', () => {
      const invalidEntry = { ...validEntry, version: 'not-semantic' };
      const result = validateVersionEntry(invalidEntry);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid semantic version format');
    });

    it('should include index in error messages when provided', () => {
      const invalidEntry = { ...validEntry, version: 'invalid' };
      const result = validateVersionEntry(invalidEntry, 5);
      expect(result.error).toContain('Version entry 5:');
    });
  });

  describe('isValidSemanticVersion', () => {
    it('should validate standard semantic versions', () => {
      const validVersions = [
        '0.0.1',
        '1.0.0',
        '10.20.30',
        '1.1.2-prerelease+meta',
        '1.1.2+meta',
        '1.1.2-alpha',
        '1.0.0-alpha.beta',
        '1.0.0-alpha.1',
        '1.0.0-alpha0.beta',
      ];

      validVersions.forEach(version => {
        expect(isValidSemanticVersion(version)).toBe(true);
      });
    });

    it('should reject invalid semantic versions', () => {
      const invalidVersions = [
        '1',
        '1.2',
        '1.2.3-',
        '1.2.3.4',
        '01.1.1',
        '1.01.1',
        '1.1.01',
        'alpha',
        '1.2.3-',
        '1.2.3+',
        '',
      ];

      invalidVersions.forEach(version => {
        expect(isValidSemanticVersion(version)).toBe(false);
      });
    });
  });

  describe('compareVersions', () => {
    it('should compare major versions correctly', () => {
      expect(compareVersions('2.0.0', '1.0.0')).toBeGreaterThan(0);
      expect(compareVersions('1.0.0', '2.0.0')).toBeLessThan(0);
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    });

    it('should compare minor versions correctly', () => {
      expect(compareVersions('1.2.0', '1.1.0')).toBeGreaterThan(0);
      expect(compareVersions('1.1.0', '1.2.0')).toBeLessThan(0);
    });

    it('should compare patch versions correctly', () => {
      expect(compareVersions('1.0.2', '1.0.1')).toBeGreaterThan(0);
      expect(compareVersions('1.0.1', '1.0.2')).toBeLessThan(0);
    });

    it('should handle pre-release versions', () => {
      expect(compareVersions('1.0.0-alpha', '1.0.0')).toBeLessThan(0);
      expect(compareVersions('1.0.0', '1.0.0-alpha')).toBeGreaterThan(0);
      expect(compareVersions('1.0.0-alpha', '1.0.0-beta')).toBeLessThan(0);
    });
  });

  describe('sortVersionsDescending', () => {
    it('should sort versions in descending order', () => {
      const versions: VersionEntry[] = [
        {
          version: '1.0.0',
          commitHash: 'a',
          timestamp: 1,
          description: 'a',
          commitUrl: 'a',
        },
        {
          version: '2.0.0',
          commitHash: 'b',
          timestamp: 2,
          description: 'b',
          commitUrl: 'b',
        },
        {
          version: '1.5.0',
          commitHash: 'c',
          timestamp: 3,
          description: 'c',
          commitUrl: 'c',
        },
      ];

      const sorted = sortVersionsDescending(versions);
      expect(sorted.map(v => v.version)).toEqual(['2.0.0', '1.5.0', '1.0.0']);
      // Should not mutate original array
      expect(versions.map(v => v.version)).toEqual(['1.0.0', '2.0.0', '1.5.0']);
    });
  });

  describe('sortVersionsAscending', () => {
    it('should sort versions in ascending order', () => {
      const versions: VersionEntry[] = [
        {
          version: '2.0.0',
          commitHash: 'a',
          timestamp: 1,
          description: 'a',
          commitUrl: 'a',
        },
        {
          version: '1.0.0',
          commitHash: 'b',
          timestamp: 2,
          description: 'b',
          commitUrl: 'b',
        },
        {
          version: '1.5.0',
          commitHash: 'c',
          timestamp: 3,
          description: 'c',
          commitUrl: 'c',
        },
      ];

      const sorted = sortVersionsAscending(versions);
      expect(sorted.map(v => v.version)).toEqual(['1.0.0', '1.5.0', '2.0.0']);
    });
  });

  describe('findVersionEntry', () => {
    const versions: VersionEntry[] = [
      {
        version: '1.0.0',
        commitHash: 'a',
        timestamp: 1,
        description: 'a',
        commitUrl: 'a',
      },
      {
        version: '2.0.0',
        commitHash: 'b',
        timestamp: 2,
        description: 'b',
        commitUrl: 'b',
      },
    ];

    it('should find existing version', () => {
      const found = findVersionEntry(versions, '2.0.0');
      expect(found?.version).toBe('2.0.0');
    });

    it('should return undefined for non-existent version', () => {
      const found = findVersionEntry(versions, '3.0.0');
      expect(found).toBeUndefined();
    });
  });

  describe('getVersionNavigation', () => {
    const versions: VersionEntry[] = [
      {
        version: '1.0.0',
        commitHash: 'a',
        timestamp: 1,
        description: 'a',
        commitUrl: 'a',
      },
      {
        version: '1.5.0',
        commitHash: 'b',
        timestamp: 2,
        description: 'b',
        commitUrl: 'b',
      },
      {
        version: '2.0.0',
        commitHash: 'c',
        timestamp: 3,
        description: 'c',
        commitUrl: 'c',
      },
    ];

    it('should provide navigation for middle version', () => {
      const nav = getVersionNavigation(versions, '1.5.0');

      expect(nav.current?.version).toBe('1.5.0');
      expect(nav.next?.version).toBe('2.0.0');
      expect(nav.previous?.version).toBe('1.0.0');
      expect(nav.currentIndex).toBe(1);
    });

    it('should handle first version (newest)', () => {
      const nav = getVersionNavigation(versions, '2.0.0');

      expect(nav.current?.version).toBe('2.0.0');
      expect(nav.next).toBeUndefined();
      expect(nav.previous?.version).toBe('1.5.0');
      expect(nav.currentIndex).toBe(0);
    });

    it('should handle last version (oldest)', () => {
      const nav = getVersionNavigation(versions, '1.0.0');

      expect(nav.current?.version).toBe('1.0.0');
      expect(nav.next?.version).toBe('1.5.0');
      expect(nav.previous).toBeUndefined();
      expect(nav.currentIndex).toBe(2);
    });

    it('should handle non-existent version', () => {
      const nav = getVersionNavigation(versions, '3.0.0');

      expect(nav.current).toBeUndefined();
      expect(nav.next).toBeUndefined();
      expect(nav.previous).toBeUndefined();
      expect(nav.currentIndex).toBe(-1);
    });
  });

  describe('formatTimestamp', () => {
    it('should format unix timestamp to locale string', () => {
      // Use a specific timestamp to ensure consistent results
      const timestamp = 1640995200; // 2022-01-01 00:00:00 UTC
      const formatted = formatTimestamp(timestamp);

      // Should be a valid date string (format may vary by locale)
      expect(formatted).toContain('2022');
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      // Mock Date.now() for consistent testing
      jest.spyOn(Date, 'now').mockReturnValue(1641081600000); // 2022-01-02 00:00:00 UTC
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should format recent timestamps as "Just now"', () => {
      const recentTimestamp = Math.floor(Date.now() / 1000) - 30; // 30 seconds ago
      expect(formatRelativeTime(recentTimestamp)).toBe('Just now');
    });

    it('should format minutes correctly', () => {
      const minutesAgo = Math.floor(Date.now() / 1000) - 5 * 60; // 5 minutes ago
      expect(formatRelativeTime(minutesAgo)).toBe('5 minutes ago');

      const oneMinuteAgo = Math.floor(Date.now() / 1000) - 60; // 1 minute ago
      expect(formatRelativeTime(oneMinuteAgo)).toBe('1 minute ago');
    });

    it('should format hours correctly', () => {
      const hoursAgo = Math.floor(Date.now() / 1000) - 3 * 60 * 60; // 3 hours ago
      expect(formatRelativeTime(hoursAgo)).toBe('3 hours ago');

      const oneHourAgo = Math.floor(Date.now() / 1000) - 60 * 60; // 1 hour ago
      expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago');
    });

    it('should format days correctly', () => {
      const daysAgo = Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60; // 2 days ago
      expect(formatRelativeTime(daysAgo)).toBe('2 days ago');

      const oneDayAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60; // 1 day ago
      expect(formatRelativeTime(oneDayAgo)).toBe('1 day ago');
    });

    it('should fall back to formatted timestamp for old dates', () => {
      const weekAgo = Math.floor(Date.now() / 1000) - 8 * 24 * 60 * 60; // 8 days ago
      const result = formatRelativeTime(weekAgo);
      expect(result).not.toContain('ago');
      expect(result).toContain('2021'); // Should be formatted date
    });
  });

  describe('extractCommitType', () => {
    it('should extract commit types from conventional commit messages', () => {
      expect(extractCommitType('feat: add new feature')).toBe('feat');
      expect(extractCommitType('fix: resolve bug')).toBe('fix');
      expect(extractCommitType('docs: update documentation')).toBe('docs');
      expect(extractCommitType('style: format code')).toBe('style');
      expect(extractCommitType('refactor: improve structure')).toBe('refactor');
      expect(extractCommitType('test: add unit tests')).toBe('test');
      expect(extractCommitType('chore: update dependencies')).toBe('chore');
    });

    it('should extract commit types with scope', () => {
      expect(extractCommitType('feat(auth): add login feature')).toBe('feat');
      expect(extractCommitType('fix(ui): resolve button styling')).toBe('fix');
    });

    it('should handle non-conventional commits', () => {
      expect(extractCommitType('Add new feature')).toBe('other');
      expect(extractCommitType('Update README')).toBe('other');
      expect(extractCommitType('')).toBe('other');
    });
  });

  describe('getVersionIncrementType', () => {
    it('should detect major version increments', () => {
      expect(getVersionIncrementType('1.0.0', '2.0.0')).toBe('major');
      expect(getVersionIncrementType('1.5.3', '2.0.0')).toBe('major');
    });

    it('should detect minor version increments', () => {
      expect(getVersionIncrementType('1.0.0', '1.1.0')).toBe('minor');
      expect(getVersionIncrementType('1.3.5', '1.4.0')).toBe('minor');
    });

    it('should detect patch version increments', () => {
      expect(getVersionIncrementType('1.0.0', '1.0.1')).toBe('patch');
      expect(getVersionIncrementType('1.2.3', '1.2.4')).toBe('patch');
    });

    it('should handle invalid versions', () => {
      expect(getVersionIncrementType('invalid', '1.0.0')).toBe('unknown');
      expect(getVersionIncrementType('1.0.0', 'invalid')).toBe('unknown');
      expect(getVersionIncrementType('invalid', 'invalid')).toBe('unknown');
    });

    it('should handle edge cases', () => {
      expect(getVersionIncrementType('2.0.0', '1.0.0')).toBe('unknown'); // Downgrade
      expect(getVersionIncrementType('1.0.0', '1.0.0')).toBe('unknown'); // Same version
    });
  });

  describe('truncateCommitHash', () => {
    it('should truncate commit hash to default length', () => {
      const hash = 'abcdef1234567890';
      expect(truncateCommitHash(hash)).toBe('abcdef12');
      expect(truncateCommitHash(hash).length).toBe(8);
    });

    it('should truncate commit hash to custom length', () => {
      const hash = 'abcdef1234567890';
      expect(truncateCommitHash(hash, 12)).toBe('abcdef123456');
      expect(truncateCommitHash(hash, 4)).toBe('abcd');
    });

    it('should handle short hashes', () => {
      const shortHash = 'abc';
      expect(truncateCommitHash(shortHash)).toBe('abc');
    });
  });

  describe('truncateCommitMessage', () => {
    it('should truncate long messages', () => {
      const longMessage =
        'This is a very long commit message that exceeds the maximum length limit';
      const truncated = truncateCommitMessage(longMessage, 30);
      expect(truncated).toBe('This is a very long commit...');
      expect(truncated.length).toBe(30);
    });

    it('should not truncate short messages', () => {
      const shortMessage = 'Short message';
      expect(truncateCommitMessage(shortMessage, 50)).toBe('Short message');
    });

    it('should use default max length', () => {
      const message = 'a'.repeat(60);
      const truncated = truncateCommitMessage(message);
      expect(truncated.length).toBe(50);
      expect(truncated.endsWith('...')).toBe(true);
    });
  });
});
