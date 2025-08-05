/**
 * Comprehensive test suite for version storage utilities
 * Tests localStorage operations, version tracking, and edge cases
 */

import {
  getVersionStorageData,
  saveVersionStorageData,
  initializeVersionStorage,
  checkForNewVersion,
  markVersionAsSeen,
  markFlashNotificationShown,
  clearVersionStorage,
  getTimeSinceLastCheck,
  shouldRefreshVersionData,
  updateLastCheckedTimestamp,
  getVersionStorageStats,
  migrateLegacyVersionStorage,
  type VersionStorageData,
} from '@/lib/version-storage';

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

// Mock window object for SSR safety tests
const mockWindow = {
  localStorage: mockLocalStorage,
};

describe('Version Storage Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.store.clear();

    // Mock global objects
    (global as any).window = mockWindow;
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete (global as any).window;
  });

  describe('getVersionStorageData', () => {
    it('should return null when localStorage is not available (SSR)', () => {
      delete (global as any).window;
      const result = getVersionStorageData();
      expect(result).toBeNull();
    });

    it('should return null when no data is stored', () => {
      const result = getVersionStorageData();
      expect(result).toBeNull();
    });

    it('should return parsed data when valid data exists', () => {
      const testData: VersionStorageData = {
        lastSeenVersion: '1.2.3',
        lastChecked: 1640995200000,
        flashNotificationShown: false,
      };

      mockLocalStorage.store.set('version-tracking', JSON.stringify(testData));

      const result = getVersionStorageData();
      expect(result).toEqual(testData);
    });

    it('should return null for invalid JSON data', () => {
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      mockLocalStorage.store.set('version-tracking', 'invalid-json');

      const result = getVersionStorageData();
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error reading version storage data:',
        expect.any(SyntaxError)
      );

      consoleSpy.mockRestore();
    });

    it('should validate data structure and return null for invalid data', () => {
      const invalidData = {
        lastSeenVersion: 123, // Should be string
        lastChecked: 1640995200000,
        flashNotificationShown: false,
      };

      mockLocalStorage.store.set(
        'version-tracking',
        JSON.stringify(invalidData)
      );

      const result = getVersionStorageData();
      expect(result).toBeNull();
    });

    it('should validate all required fields', () => {
      const testCases = [
        {
          lastSeenVersion: '1.2.3',
          lastChecked: 'invalid',
          flashNotificationShown: false,
        },
        {
          lastSeenVersion: '1.2.3',
          lastChecked: 1640995200000,
          flashNotificationShown: 'invalid',
        },
        { lastChecked: 1640995200000, flashNotificationShown: false }, // Missing lastSeenVersion
      ];

      testCases.forEach(invalidData => {
        mockLocalStorage.store.set(
          'version-tracking',
          JSON.stringify(invalidData)
        );
        const result = getVersionStorageData();
        expect(result).toBeNull();
      });
    });
  });

  describe('saveVersionStorageData', () => {
    it('should return false when localStorage is not available (SSR)', () => {
      delete (global as any).window;
      const data: VersionStorageData = {
        lastSeenVersion: '1.2.3',
        lastChecked: Date.now(),
        flashNotificationShown: false,
      };

      const result = saveVersionStorageData(data);
      expect(result).toBe(false);
    });

    it('should save data successfully', () => {
      const data: VersionStorageData = {
        lastSeenVersion: '1.2.3',
        lastChecked: 1640995200000,
        flashNotificationShown: false,
      };

      const result = saveVersionStorageData(data);
      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'version-tracking',
        JSON.stringify(data)
      );
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      const error = new Error('Storage quota exceeded');
      mockLocalStorage.setItem.mockImplementation(() => {
        throw error;
      });

      const data: VersionStorageData = {
        lastSeenVersion: '1.2.3',
        lastChecked: Date.now(),
        flashNotificationShown: false,
      };

      const result = saveVersionStorageData(data);
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error saving version storage data:',
        error
      );

      consoleSpy.mockRestore();
    });
  });

  describe('initializeVersionStorage', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1640995200000);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should initialize storage with current version', () => {
      const currentVersion = '1.2.3';
      const result = initializeVersionStorage(currentVersion);

      const expectedData: VersionStorageData = {
        lastSeenVersion: '1.2.3',
        lastChecked: 1640995200000,
        flashNotificationShown: false,
      };

      expect(result).toEqual(expectedData);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'version-tracking',
        JSON.stringify(expectedData)
      );
    });
  });

  describe('checkForNewVersion', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1640995200000);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should handle first-time visitors', () => {
      const result = checkForNewVersion('1.2.3');

      expect(result).toEqual({
        hasNewVersion: false,
        previousVersion: null,
        shouldShowFlash: false,
      });

      // Should initialize storage
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should detect new version', () => {
      const existingData: VersionStorageData = {
        lastSeenVersion: '1.2.2',
        lastChecked: 1640995100000,
        flashNotificationShown: false,
      };
      mockLocalStorage.store.set(
        'version-tracking',
        JSON.stringify(existingData)
      );

      const result = checkForNewVersion('1.2.3');

      expect(result).toEqual({
        hasNewVersion: true,
        previousVersion: '1.2.2',
        shouldShowFlash: true,
      });
    });

    it('should not show flash if already shown', () => {
      const existingData: VersionStorageData = {
        lastSeenVersion: '1.2.2',
        lastChecked: 1640995100000,
        flashNotificationShown: true,
      };
      mockLocalStorage.store.set(
        'version-tracking',
        JSON.stringify(existingData)
      );

      const result = checkForNewVersion('1.2.3');

      expect(result).toEqual({
        hasNewVersion: true,
        previousVersion: '1.2.2',
        shouldShowFlash: false,
      });
    });

    it('should handle same version', () => {
      const existingData: VersionStorageData = {
        lastSeenVersion: '1.2.3',
        lastChecked: 1640995100000,
        flashNotificationShown: false,
      };
      mockLocalStorage.store.set(
        'version-tracking',
        JSON.stringify(existingData)
      );

      const result = checkForNewVersion('1.2.3');

      expect(result).toEqual({
        hasNewVersion: false,
        previousVersion: '1.2.3',
        shouldShowFlash: false,
      });
    });
  });

  describe('markVersionAsSeen', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1640995200000);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should update version as seen', () => {
      const result = markVersionAsSeen('1.2.3');

      expect(result).toBe(true);

      const expectedData: VersionStorageData = {
        lastSeenVersion: '1.2.3',
        lastChecked: 1640995200000,
        flashNotificationShown: false,
      };

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'version-tracking',
        JSON.stringify(expectedData)
      );
    });

    it('should reset flash notification flag', () => {
      const existingData: VersionStorageData = {
        lastSeenVersion: '1.2.2',
        lastChecked: 1640995100000,
        flashNotificationShown: true,
      };
      mockLocalStorage.store.set(
        'version-tracking',
        JSON.stringify(existingData)
      );

      markVersionAsSeen('1.2.3');

      const savedData = JSON.parse(
        mockLocalStorage.store.get('version-tracking')!
      );
      expect(savedData.flashNotificationShown).toBe(false);
    });
  });

  describe('markFlashNotificationShown', () => {
    it('should return false when no data exists', () => {
      const result = markFlashNotificationShown();
      expect(result).toBe(false);
    });

    it('should update flash notification flag', () => {
      const existingData: VersionStorageData = {
        lastSeenVersion: '1.2.3',
        lastChecked: 1640995100000,
        flashNotificationShown: false,
      };
      mockLocalStorage.store.set(
        'version-tracking',
        JSON.stringify(existingData)
      );

      const result = markFlashNotificationShown();
      expect(result).toBe(true);

      const savedData = JSON.parse(
        mockLocalStorage.store.get('version-tracking')!
      );
      expect(savedData.flashNotificationShown).toBe(true);
      expect(savedData.lastSeenVersion).toBe('1.2.3'); // Should preserve other data
    });
  });

  describe('clearVersionStorage', () => {
    it('should return false when localStorage is not available (SSR)', () => {
      delete (global as any).window;
      const result = clearVersionStorage();
      expect(result).toBe(false);
    });

    it('should clear all version storage data', () => {
      mockLocalStorage.store.set('version-tracking', 'some-data');
      mockLocalStorage.store.set('version-flash-shown', 'legacy-data');

      const result = clearVersionStorage();
      expect(result).toBe(true);

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'version-tracking'
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'version-flash-shown'
      );
    });

    it('should handle storage errors gracefully', () => {
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      const error = new Error('Storage error');
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw error;
      });

      const result = clearVersionStorage();
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error clearing version storage:',
        error
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getTimeSinceLastCheck', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1640995200000);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return null when no data exists', () => {
      const result = getTimeSinceLastCheck();
      expect(result).toBeNull();
    });

    it('should calculate time since last check', () => {
      const existingData: VersionStorageData = {
        lastSeenVersion: '1.2.3',
        lastChecked: 1640995100000, // 100 seconds ago
        flashNotificationShown: false,
      };
      mockLocalStorage.store.set(
        'version-tracking',
        JSON.stringify(existingData)
      );

      const result = getTimeSinceLastCheck();
      expect(result).toBe(100000); // 100 seconds in milliseconds
    });
  });

  describe('shouldRefreshVersionData', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1640995200000);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return true when no data exists', () => {
      const result = shouldRefreshVersionData();
      expect(result).toBe(true);
    });

    it('should return true when data is older than max age', () => {
      const existingData: VersionStorageData = {
        lastSeenVersion: '1.2.3',
        lastChecked: 1640995200000 - 10 * 60 * 1000, // 10 minutes ago
        flashNotificationShown: false,
      };
      mockLocalStorage.store.set(
        'version-tracking',
        JSON.stringify(existingData)
      );

      const result = shouldRefreshVersionData(5 * 60 * 1000); // 5 minute max age
      expect(result).toBe(true);
    });

    it('should return false when data is recent', () => {
      const existingData: VersionStorageData = {
        lastSeenVersion: '1.2.3',
        lastChecked: 1640995200000 - 2 * 60 * 1000, // 2 minutes ago
        flashNotificationShown: false,
      };
      mockLocalStorage.store.set(
        'version-tracking',
        JSON.stringify(existingData)
      );

      const result = shouldRefreshVersionData(5 * 60 * 1000); // 5 minute max age
      expect(result).toBe(false);
    });

    it('should use default max age', () => {
      const existingData: VersionStorageData = {
        lastSeenVersion: '1.2.3',
        lastChecked: 1640995200000 - 10 * 60 * 1000, // 10 minutes ago
        flashNotificationShown: false,
      };
      mockLocalStorage.store.set(
        'version-tracking',
        JSON.stringify(existingData)
      );

      const result = shouldRefreshVersionData(); // Default 5 minutes
      expect(result).toBe(true);
    });
  });

  describe('updateLastCheckedTimestamp', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1640995200000);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return false when no data exists', () => {
      const result = updateLastCheckedTimestamp();
      expect(result).toBe(false);
    });

    it('should update timestamp without changing other data', () => {
      const existingData: VersionStorageData = {
        lastSeenVersion: '1.2.3',
        lastChecked: 1640995100000,
        flashNotificationShown: true,
      };
      mockLocalStorage.store.set(
        'version-tracking',
        JSON.stringify(existingData)
      );

      const result = updateLastCheckedTimestamp();
      expect(result).toBe(true);

      const savedData = JSON.parse(
        mockLocalStorage.store.get('version-tracking')!
      );
      expect(savedData.lastChecked).toBe(1640995200000);
      expect(savedData.lastSeenVersion).toBe('1.2.3');
      expect(savedData.flashNotificationShown).toBe(true);
    });
  });

  describe('getVersionStorageStats', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1640995200000);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return hasStoredData false when no data exists', () => {
      const result = getVersionStorageStats();
      expect(result).toEqual({
        hasStoredData: false,
      });
    });

    it('should return complete stats when data exists', () => {
      const existingData: VersionStorageData = {
        lastSeenVersion: '1.2.3',
        lastChecked: 1640995100000,
        flashNotificationShown: true,
      };
      mockLocalStorage.store.set(
        'version-tracking',
        JSON.stringify(existingData)
      );

      const result = getVersionStorageStats();
      expect(result).toEqual({
        hasStoredData: true,
        lastSeenVersion: '1.2.3',
        lastChecked: 1640995100000,
        timeSinceLastCheck: 100000,
        flashNotificationShown: true,
      });
    });
  });

  describe('migrateLegacyVersionStorage', () => {
    it('should return false when localStorage is not available (SSR)', () => {
      delete (global as any).window;
      const result = migrateLegacyVersionStorage();
      expect(result).toBe(false);
    });

    it('should remove legacy flash notification key', () => {
      mockLocalStorage.store.set('version-flash-shown', 'true');

      const result = migrateLegacyVersionStorage();
      expect(result).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'version-flash-shown'
      );
    });

    it('should handle migration without legacy data', () => {
      const result = migrateLegacyVersionStorage();
      expect(result).toBe(true);
    });

    it('should handle migration errors gracefully', () => {
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      const error = new Error('Migration error');
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw error;
      });
      mockLocalStorage.store.set('version-flash-shown', 'true');

      const result = migrateLegacyVersionStorage();
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error migrating legacy version storage:',
        error
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle localStorage quota exceeded errors', () => {
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      const quotaError = new Error('QuotaExceededError');
      mockLocalStorage.setItem.mockImplementation(() => {
        throw quotaError;
      });

      const data: VersionStorageData = {
        lastSeenVersion: '1.2.3',
        lastChecked: Date.now(),
        flashNotificationShown: false,
      };

      const result = saveVersionStorageData(data);
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle corrupted storage data gracefully', () => {
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      // Test various corrupted data scenarios
      const corruptedData = [
        '{"lastSeenVersion": "1.2.3"', // Incomplete JSON
        '{"lastSeenVersion": null, "lastChecked": 123, "flashNotificationShown": false}', // Null value
        '{"unknown": "data"}', // Missing required fields
      ];

      corruptedData.forEach(data => {
        mockLocalStorage.store.set('version-tracking', data);
        const result = getVersionStorageData();
        expect(result).toBeNull();
      });

      consoleSpy.mockRestore();
    });

    it('should maintain data consistency across operations', () => {
      // Initialize with data
      const initialData: VersionStorageData = {
        lastSeenVersion: '1.2.3',
        lastChecked: 1640995100000,
        flashNotificationShown: false,
      };

      expect(saveVersionStorageData(initialData)).toBe(true);
      expect(getVersionStorageData()).toEqual(initialData);

      // Mark flash as shown
      expect(markFlashNotificationShown()).toBe(true);
      const afterFlash = getVersionStorageData();
      expect(afterFlash?.flashNotificationShown).toBe(true);
      expect(afterFlash?.lastSeenVersion).toBe('1.2.3');

      // Update version
      expect(markVersionAsSeen('1.2.4')).toBe(true);
      const afterVersion = getVersionStorageData();
      expect(afterVersion?.lastSeenVersion).toBe('1.2.4');
      expect(afterVersion?.flashNotificationShown).toBe(false); // Reset on version update
    });
  });
});
