// ===========================================
// src/services/storage/base.ts
// Base Storage Service with Common Functionality
// ===========================================

// ========================================
// Storage Interface Definitions
// ========================================

export interface StorageConfig {
  encryptionEnabled: boolean;
  compressionEnabled: boolean;
  maxStorageSize: number; // in MB
  cacheTTL: number; // in milliseconds
  syncEnabled: boolean;
  backupEnabled: boolean;
}

export interface StorageEntry<T = any> {
  data: T;
  timestamp: Date;
  expiresAt?: Date;
  version: number;
  checksum?: string;
  compressed?: boolean;
  encrypted?: boolean;
}

export interface StorageStats {
  totalSize: number;
  entryCount: number;
  cacheHitRate: number;
  lastCleanup: Date;
  compressionRatio: number;
}

export interface StorageOptions {
  ttl?: number;
  compress?: boolean;
  encrypt?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

// ========================================
// Storage Result Types
// ========================================

export type StorageResult<T> = {
  success: true;
  data: T;
  fromCache?: boolean;
  timestamp: Date;
} | {
  success: false;
  error: StorageError;
  timestamp: Date;
};

export class StorageError extends Error {
  public readonly code: string;
  public readonly details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
    this.details = details;
  }
}

// ========================================
// Base Storage Service Class
// ========================================

export abstract class BaseStorageService {
  protected config: StorageConfig;
  protected stats: StorageStats;
  protected compressionEnabled: boolean;
  protected encryptionKey?: string;

  constructor(config: StorageConfig) {
    this.config = config;
    this.compressionEnabled = config.compressionEnabled;
    this.stats = {
      totalSize: 0,
      entryCount: 0,
      cacheHitRate: 0,
      lastCleanup: new Date(),
      compressionRatio: 1.0
    };
  }

  // ========================================
  // Abstract Methods (Platform-specific)
  // ========================================

  abstract get storageType(): string;
  abstract getRawValue(key: string): Promise<string | null>;
  abstract setRawValue(key: string, value: string): Promise<void>;
  abstract removeRawValue(key: string): Promise<void>;
  abstract getAllKeys(): Promise<string[]>;
  abstract getStorageSize(): Promise<number>;
  abstract clearAll(): Promise<void>;

  // ========================================
  // Public API Methods
  // ========================================

  async get<T>(key: string): Promise<StorageResult<T>> {
    try {
      const rawValue = await this.getRawValue(key);
      
      if (!rawValue) {
        return {
          success: false,
          error: new StorageError('NOT_FOUND', `Key '${key}' not found`),
          timestamp: new Date()
        };
      }

      const entry = await this.deserializeEntry<T>(rawValue);
      
      // Check expiration
      if (entry.expiresAt && new Date() > entry.expiresAt) {
        await this.remove(key);
        return {
          success: false,
          error: new StorageError('EXPIRED', `Key '${key}' has expired`),
          timestamp: new Date()
        };
      }

      // Verify data integrity
      if (entry.checksum && !this.verifyChecksum(entry.data, entry.checksum)) {
        await this.remove(key);
        return {
          success: false,
          error: new StorageError('CORRUPTED', `Data corruption detected for key '${key}'`),
          timestamp: new Date()
        };
      }

      return {
        success: true,
        data: entry.data,
        fromCache: true,
        timestamp: entry.timestamp
      };

    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          'READ_ERROR',
          `Failed to read key '${key}': ${error instanceof Error ? error.message : 'Unknown error'}`,
          error
        ),
        timestamp: new Date()
      };
    }
  }

  async set<T>(key: string, data: T, options: StorageOptions = {}): Promise<StorageResult<void>> {
    try {
      const entry: StorageEntry<T> = {
        data,
        timestamp: new Date(),
        version: 1
      };

      // Set expiration
      if (options.ttl || this.config.cacheTTL) {
        const ttl = options.ttl || this.config.cacheTTL;
        entry.expiresAt = new Date(Date.now() + ttl);
      }

      // Add checksum for data integrity
      entry.checksum = this.generateChecksum(data);

      const serializedEntry = await this.serializeEntry(entry, options);
      await this.setRawValue(key, serializedEntry);
      
      this.updateStats('set', serializedEntry.length);

      return {
        success: true,
        data: undefined,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          'WRITE_ERROR',
          `Failed to write key '${key}': ${error instanceof Error ? error.message : 'Unknown error'}`,
          error
        ),
        timestamp: new Date()
      };
    }
  }

  async remove(key: string): Promise<StorageResult<void>> {
    try {
      await this.removeRawValue(key);
      this.updateStats('remove');

      return {
        success: true,
        data: undefined,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          'DELETE_ERROR',
          `Failed to delete key '${key}': ${error instanceof Error ? error.message : 'Unknown error'}`,
          error
        ),
        timestamp: new Date()
      };
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const value = await this.getRawValue(key);
      return value !== null;
    } catch {
      return false;
    }
  }

  async getMultiple<T>(keys: string[]): Promise<Map<string, StorageResult<T>>> {
    const results = new Map<string, StorageResult<T>>();
    
    await Promise.all(
      keys.map(async (key) => {
        const result = await this.get<T>(key);
        results.set(key, result);
      })
    );

    return results;
  }

  async setMultiple<T>(entries: Map<string, T>, options: StorageOptions = {}): Promise<Map<string, StorageResult<void>>> {
    const results = new Map<string, StorageResult<void>>();
    
    await Promise.all(
      Array.from(entries.entries()).map(async ([key, data]) => {
        const result = await this.set(key, data, options);
        results.set(key, result);
      })
    );

    return results;
  }

  async getKeys(pattern?: string): Promise<string[]> {
    const allKeys = await this.getAllKeys();
    
    if (!pattern) {
      return allKeys;
    }

    const regex = new RegExp(pattern);
    return allKeys.filter(key => regex.test(key));
  }

  async clear(pattern?: string): Promise<StorageResult<void>> {
    try {
      if (pattern) {
        const keys = await this.getKeys(pattern);
        await Promise.all(keys.map(key => this.remove(key)));
      } else {
        await this.clearAll();
        this.resetStats();
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
          'CLEAR_ERROR',
          `Failed to clear storage: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error
        ),
        timestamp: new Date()
      };
    }
  }

  // ========================================
  // Maintenance Operations
  // ========================================

  async cleanup(): Promise<void> {
    try {
      const keys = await this.getAllKeys();
      const expiredKeys: string[] = [];

      // Check each key for expiration
      await Promise.all(
        keys.map(async (key) => {
          try {
            const rawValue = await this.getRawValue(key);
            if (rawValue) {
              const entry = await this.deserializeEntry(rawValue);
              if (entry.expiresAt && new Date() > entry.expiresAt) {
                expiredKeys.push(key);
              }
            }
          } catch {
            // If we can't deserialize, consider it corrupted and remove
            expiredKeys.push(key);
          }
        })
      );

      // Remove expired keys
      await Promise.all(expiredKeys.map(key => this.removeRawValue(key)));
      
      this.stats.lastCleanup = new Date();
      this.updateStats('cleanup', 0, expiredKeys.length);

    } catch (error) {
      console.error('Storage cleanup failed:', error);
    }
  }

  async compact(): Promise<void> {
    // Override in platform-specific implementations if needed
    // This is a no-op in the base class
  }

  async getStats(): Promise<StorageStats> {
    try {
      const currentSize = await this.getStorageSize();
      this.stats.totalSize = currentSize;
      
      const keys = await this.getAllKeys();
      this.stats.entryCount = keys.length;
      
      return { ...this.stats };
    } catch {
      return { ...this.stats };
    }
  }

  // ========================================
  // Serialization & Compression
  // ========================================

  private async serializeEntry<T>(entry: StorageEntry<T>, options: StorageOptions): Promise<string> {
    let serialized = JSON.stringify(entry);

    // Compress if enabled
    if ((options.compress ?? this.config.compressionEnabled) && this.compressionEnabled) {
      serialized = await this.compress(serialized);
      entry.compressed = true;
    }

    // Encrypt if enabled
    if ((options.encrypt ?? this.config.encryptionEnabled) && this.encryptionKey) {
      serialized = await this.encrypt(serialized);
      entry.encrypted = true;
    }

    return serialized;
  }

  private async deserializeEntry<T>(serialized: string): Promise<StorageEntry<T>> {
    let data = serialized;

    // Try to parse as JSON first to check if it's encrypted/compressed
    let entry: StorageEntry<T>;
    try {
      entry = JSON.parse(data);
    } catch {
      // If parsing fails, it might be encrypted or compressed
      // Try decryption first, then decompression
      if (this.encryptionKey) {
        try {
          data = await this.decrypt(data);
        } catch {
          // Not encrypted, continue
        }
      }

      if (this.compressionEnabled) {
        try {
          data = await this.decompress(data);
        } catch {
          // Not compressed, continue
        }
      }

      entry = JSON.parse(data);
    }

    // Handle legacy entries without proper structure
    if (!entry.timestamp) {
      entry = {
        data: entry as any,
        timestamp: new Date(),
        version: 1
      };
    }

    return entry;
  }

  // ========================================
  // Compression (Platform-specific implementations)
  // ========================================

  protected async compress(data: string): Promise<string> {
    // Simple compression using deflate (would need platform-specific implementation)
    // For now, return as-is
    return data;
  }

  protected async decompress(data: string): Promise<string> {
    // Simple decompression using inflate (would need platform-specific implementation)
    // For now, return as-is
    return data;
  }

  // ========================================
  // Encryption (Platform-specific implementations)
  // ========================================

  protected async encrypt(data: string): Promise<string> {
    // Simple encryption (would need platform-specific implementation)
    // For now, return as-is
    return data;
  }

  protected async decrypt(data: string): Promise<string> {
    // Simple decryption (would need platform-specific implementation)
    // For now, return as-is
    return data;
  }

  // ========================================
  // Data Integrity
  // ========================================

  private generateChecksum<T>(data: T): string {
    // Simple checksum using JSON stringification and basic hash
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private verifyChecksum<T>(data: T, expectedChecksum: string): boolean {
    const actualChecksum = this.generateChecksum(data);
    return actualChecksum === expectedChecksum;
  }

  // ========================================
  // Statistics & Monitoring
  // ========================================

  private updateStats(operation: 'set' | 'remove' | 'cleanup', size: number = 0, removedCount: number = 0): void {
    switch (operation) {
      case 'set':
        this.stats.entryCount++;
        this.stats.totalSize += size;
        break;
      case 'remove':
        this.stats.entryCount = Math.max(0, this.stats.entryCount - 1);
        break;
      case 'cleanup':
        this.stats.entryCount = Math.max(0, this.stats.entryCount - removedCount);
        break;
    }
  }

  private resetStats(): void {
    this.stats = {
      totalSize: 0,
      entryCount: 0,
      cacheHitRate: 0,
      lastCleanup: new Date(),
      compressionRatio: 1.0
    };
  }

  // ========================================
  // Configuration
  // ========================================

  public updateConfig(config: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...config };
    this.compressionEnabled = this.config.compressionEnabled;
  }

  public getConfig(): StorageConfig {
    return { ...this.config };
  }

  public setEncryptionKey(key: string): void {
    this.encryptionKey = key;
  }
}

// ========================================
// Utility Functions
// ========================================

export function createStorageKey(namespace: string, key: string): string {
  return `${namespace}:${key}`;
}

export function parseStorageKey(fullKey: string): { namespace: string; key: string } {
  const [namespace, ...keyParts] = fullKey.split(':');
  return {
    namespace,
    key: keyParts.join(':')
  };
}

export function isExpired(expiresAt?: Date): boolean {
  return expiresAt ? new Date() > expiresAt : false;
}

export function calculateTTL(expiresAt?: Date): number {
  if (!expiresAt) return 0;
  return Math.max(0, expiresAt.getTime() - Date.now());
}

// ========================================
// Storage Event Types
// ========================================

export interface StorageEvent {
  type: 'set' | 'get' | 'remove' | 'clear' | 'cleanup';
  key?: string;
  success: boolean;
  timestamp: Date;
  metadata?: any;
}

export type StorageEventListener = (event: StorageEvent) => void;

// ========================================
// Default Configuration
// ========================================

export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  encryptionEnabled: false,
  compressionEnabled: true,
  maxStorageSize: 50, // 50MB
  cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
  syncEnabled: false,
  backupEnabled: false
};