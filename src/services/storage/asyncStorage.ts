// ===========================================
// src/services/storage/asyncStorage.ts
// React Native AsyncStorage Implementation
// ===========================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { BaseStorageService, StorageConfig, StorageResult, StorageError, DEFAULT_STORAGE_CONFIG } from './base';

// ========================================
// AsyncStorage Service Implementation
// ========================================

export class AsyncStorageService extends BaseStorageService {
  private static instance: AsyncStorageService;
  private eventListeners: Set<(event: any) => void> = new Set();

  private constructor(config: StorageConfig = DEFAULT_STORAGE_CONFIG) {
    super(config);
    this.initializeCleanup();
  }

  // ========================================
  // Singleton Pattern
  // ========================================

  public static getInstance(config?: StorageConfig): AsyncStorageService {
    if (!AsyncStorageService.instance) {
      AsyncStorageService.instance = new AsyncStorageService(config);
    }
    return AsyncStorageService.instance;
  }

  // ========================================
  // Base Class Implementation
  // ========================================

  get storageType(): string {
    return 'AsyncStorage';
  }

  async getRawValue(key: string): Promise<string | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      this.emitEvent('get', key, value !== null);
      return value;
    } catch (error) {
      this.emitEvent('get', key, false, error);
      throw new StorageError(
        'READ_ERROR',
        `Failed to read from AsyncStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  async setRawValue(key: string, value: string): Promise<void> {
    try {
      // Check storage size limits
      await this.enforceStorageLimit();
      
      await AsyncStorage.setItem(key, value);
      this.emitEvent('set', key, true);
    } catch (error) {
      this.emitEvent('set', key, false, error);
      throw new StorageError(
        'WRITE_ERROR',
        `Failed to write to AsyncStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  async removeRawValue(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      this.emitEvent('remove', key, true);
    } catch (error) {
      this.emitEvent('remove', key, false, error);
      throw new StorageError(
        'DELETE_ERROR',
        `Failed to remove from AsyncStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      throw new StorageError(
        'KEYS_ERROR',
        `Failed to get keys from AsyncStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  async getStorageSize(): Promise<number> {
    try {
      const keys = await this.getAllKeys();
      let totalSize = 0;

      // Get size of all values (this is approximate)
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }

      return totalSize;
    } catch (error) {
      throw new StorageError(
        'SIZE_ERROR',
        `Failed to calculate storage size: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
      this.emitEvent('clear', undefined, true);
    } catch (error) {
      this.emitEvent('clear', undefined, false, error);
      throw new StorageError(
        'CLEAR_ERROR',
        `Failed to clear AsyncStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  // ========================================
  // Enhanced AsyncStorage Methods
  // ========================================

  async getMultipleRaw(keys: string[]): Promise<[string, string | null][]> {
    try {
      const keyValuePairs = await AsyncStorage.multiGet(keys);
      keys.forEach(key => this.emitEvent('get', key, true));
      return keyValuePairs;
    } catch (error) {
      keys.forEach(key => this.emitEvent('get', key, false, error));
      throw new StorageError(
        'MULTI_GET_ERROR',
        `Failed to get multiple values: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  async setMultipleRaw(keyValuePairs: [string, string][]): Promise<void> {
    try {
      await this.enforceStorageLimit();
      await AsyncStorage.multiSet(keyValuePairs);
      keyValuePairs.forEach(([key]) => this.emitEvent('set', key, true));
    } catch (error) {
      keyValuePairs.forEach(([key]) => this.emitEvent('set', key, false, error));
      throw new StorageError(
        'MULTI_SET_ERROR',
        `Failed to set multiple values: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  async removeMultiple(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
      keys.forEach(key => this.emitEvent('remove', key, true));
    } catch (error) {
      keys.forEach(key => this.emitEvent('remove', key, false, error));
      throw new StorageError(
        'MULTI_REMOVE_ERROR',
        `Failed to remove multiple values: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  // ========================================
  // Storage Management
  // ========================================

  private async enforceStorageLimit(): Promise<void> {
    const currentSize = await this.getStorageSize();
    const maxSizeBytes = this.config.maxStorageSize * 1024 * 1024; // Convert MB to bytes

    if (currentSize > maxSizeBytes) {
      await this.performLRUCleanup(maxSizeBytes * 0.8); // Clean up to 80% of max size
    }
  }

  private async performLRUCleanup(targetSize: number): Promise<void> {
    try {
      const keys = await this.getAllKeys();
      const keyMetadata: Array<{ key: string; lastAccessed: Date; size: number }> = [];

      // Collect metadata for each key
      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            const entry = JSON.parse(value);
            keyMetadata.push({
              key,
              lastAccessed: new Date(entry.timestamp || 0),
              size: new Blob([value]).size
            });
          }
        } catch {
          // If we can't parse the entry, mark it for removal
          keyMetadata.push({
            key,
            lastAccessed: new Date(0),
            size: 0
          });
        }
      }

      // Sort by last accessed (oldest first)
      keyMetadata.sort((a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime());

      // Remove oldest entries until we reach target size
      let currentSize = keyMetadata.reduce((sum, item) => sum + item.size, 0);
      const keysToRemove: string[] = [];

      for (const item of keyMetadata) {
        if (currentSize <= targetSize) break;
        keysToRemove.push(item.key);
        currentSize -= item.size;
      }

      if (keysToRemove.length > 0) {
        await this.removeMultiple(keysToRemove);
      }

    } catch (error) {
      console.error('LRU cleanup failed:', error);
    }
  }

  // ========================================
  // Initialization & Cleanup
  // ========================================

  private initializeCleanup(): void {
    // Perform cleanup on initialization
    setTimeout(() => {
      this.cleanup().catch(error => {
        console.error('Initial cleanup failed:', error);
      });
    }, 1000);

    // Schedule periodic cleanup
    setInterval(() => {
      this.cleanup().catch(error => {
        console.error('Periodic cleanup failed:', error);
      });
    }, 60 * 60 * 1000); // Every hour
  }

  // ========================================
  // Event System
  // ========================================

  private emitEvent(type: string, key?: string, success: boolean = true, error?: any): void {
    const event = {
      type,
      key,
      success,
      timestamp: new Date(),
      metadata: error ? { error: error.message } : undefined
    };

    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (listenerError) {
        console.error('Storage event listener error:', listenerError);
      }
    });
  }

  public addEventListener(listener: (event: any) => void): void {
    this.eventListeners.add(listener);
  }

  public removeEventListener(listener: (event: any) => void): void {
    this.eventListeners.delete(listener);
  }

  // ========================================
  // Backup & Restore
  // ========================================

  async exportData(): Promise<StorageResult<string>> {
    try {
      const keys = await this.getAllKeys();
      const keyValuePairs = await this.getMultipleRaw(keys);
      
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: Object.fromEntries(keyValuePairs)
      };

      return {
        success: true,
        data: JSON.stringify(exportData),
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          'EXPORT_ERROR',
          `Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error
        ),
        timestamp: new Date()
      };
    }
  }

  async importData(jsonData: string, overwrite: boolean = false): Promise<StorageResult<void>> {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.version || !importData.data) {
        throw new Error('Invalid import data format');
      }

      const entries = Object.entries(importData.data) as [string, string][];
      
      if (!overwrite) {
        // Filter out existing keys
        const existingKeys = await this.getAllKeys();
        const filteredEntries = entries.filter(([key]) => !existingKeys.includes(key));
        await this.setMultipleRaw(filteredEntries);
      } else {
        await this.setMultipleRaw(entries);
      }

      return {
        success: true,
        data: undefined,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          'IMPORT_ERROR',
          `Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error
        ),
        timestamp: new Date()
      };
    }
  }

  // ========================================
  // Migration Support
  // ========================================

  async migrateData(migrationFn: (key: string, value: any) => { key: string; value: any } | null): Promise<void> {
    try {
      const keys = await this.getAllKeys();
      const migrations: [string, string][] = [];
      const removals: string[] = [];

      for (const key of keys) {
        const rawValue = await AsyncStorage.getItem(key);
        if (rawValue) {
          try {
            const parsedValue = JSON.parse(rawValue);
            const migrationResult = migrationFn(key, parsedValue);
            
            if (migrationResult) {
              if (migrationResult.key !== key) {
                removals.push(key);
              }
              migrations.push([migrationResult.key, JSON.stringify(migrationResult.value)]);
            } else {
              removals.push(key);
            }
          } catch {
            // Skip invalid JSON entries
            removals.push(key);
          }
        }
      }

      // Apply migrations
      if (migrations.length > 0) {
        await this.setMultipleRaw(migrations);
      }

      // Remove old/invalid entries
      if (removals.length > 0) {
        await this.removeMultiple(removals);
      }

    } catch (error) {
      throw new StorageError(
        'MIGRATION_ERROR',
        `Data migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  // ========================================
  // Developer Tools
  // ========================================

  async debugInfo(): Promise<any> {
    try {
      const keys = await this.getAllKeys();
      const stats = await this.getStats();
      const sample = {};

      // Get sample of data (first 10 keys)
      for (const key of keys.slice(0, 10)) {
        const value = await AsyncStorage.getItem(key);
        (sample as any)[key] = value ? JSON.parse(value) : null;
      }

      return {
        storageType: this.storageType,
        config: this.config,
        stats,
        keyCount: keys.length,
        sampleKeys: keys.slice(0, 10),
        sampleData: sample
      };

    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async validateIntegrity(): Promise<{ valid: number; invalid: string[]; corrupted: string[] }> {
    const keys = await this.getAllKeys();
    const results = { valid: 0, invalid: [], corrupted: [] };

    for (const key of keys) {
      try {
        const rawValue = await AsyncStorage.getItem(key);
        if (rawValue) {
          const entry = JSON.parse(rawValue);
          
          // Validate structure
          if (entry.data !== undefined && entry.timestamp) {
            // Verify checksum if present
            if (entry.checksum) {
              const isValid = this.verifyChecksum(entry.data, entry.checksum);
              if (isValid) {
                results.valid++;
              } else {
                (results.corrupted as any).push(key);
              }
            } else {
              results.valid++;
            }
          } else {
            (results.invalid as any).push(key);
          }
        }
      } catch {
        (results.invalid as any).push(key);
      }
    }

    return results;
  }

  private verifyChecksum<T>(data: T, expectedChecksum: string): boolean {
    // This would use the same checksum generation logic from the base class
    // For now, simplified implementation
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36) === expectedChecksum;
  }
}

// ========================================
// Factory Function
// ========================================

export function createAsyncStorageService(config?: Partial<StorageConfig>): AsyncStorageService {
  const finalConfig = { ...DEFAULT_STORAGE_CONFIG, ...config };
  return AsyncStorageService.getInstance(finalConfig);
}

// ========================================
// Default Export
// ========================================

export default AsyncStorageService;