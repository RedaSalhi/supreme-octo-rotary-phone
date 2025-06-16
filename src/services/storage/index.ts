// ===========================================
// src/services/storage/index.ts
// Storage Services Main Export & Factory
// ===========================================

// Base exports
export { 
  BaseStorageService, 
  StorageError, 
  DEFAULT_STORAGE_CONFIG,
  createStorageKey,
  parseStorageKey,
  isExpired,
  calculateTTL
} from './base';

export { AsyncStorageService, createAsyncStorageService } from './asyncStorage';

// Types
export type {
  StorageConfig,
  StorageEntry,
  StorageStats,
  StorageOptions,
  StorageResult,
  StorageEvent,
  StorageEventListener
} from './base';

// ===========================================
// Storage Namespaces
// ===========================================

export const STORAGE_NAMESPACES = {
  USER_PREFERENCES: 'user_preferences',
  PORTFOLIO_DATA: 'portfolio_data',
  MARKET_DATA: 'market_data',
  ANALYTICS: 'analytics',
  CACHE: 'cache',
  SESSIONS: 'sessions',
  SETTINGS: 'settings',
  TEMP: 'temp'
} as const;

export type StorageNamespace = typeof STORAGE_NAMESPACES[keyof typeof STORAGE_NAMESPACES];

// ===========================================
// Specialized Storage Services
// ===========================================

/**
 * Portfolio Data Storage Service
 * Handles portfolio persistence with validation and backup
 */
export class PortfolioStorageService {
  private storage: AsyncStorageService;
  private namespace = STORAGE_NAMESPACES.PORTFOLIO_DATA;

  constructor(storage: AsyncStorageService) {
    this.storage = storage;
  }

  async savePortfolio(portfolioId: string, portfolio: any): Promise<StorageResult<void>> {
    const key = createStorageKey(this.namespace, portfolioId);
    
    // Add metadata
    const portfolioWithMeta = {
      ...portfolio,
      id: portfolioId,
      lastModified: new Date(),
      version: portfolio.version || 1
    };

    return this.storage.set(key, portfolioWithMeta, {
      encrypt: true, // Encrypt sensitive portfolio data
      compress: true
    });
  }

  async getPortfolio(portfolioId: string): Promise<StorageResult<any>> {
    const key = createStorageKey(this.namespace, portfolioId);
    return this.storage.get(key);
  }

  async getAllPortfolios(): Promise<StorageResult<any[]>> {
    try {
      const keys = await this.storage.getKeys(`${this.namespace}:`);
      const portfolios = [];

      for (const key of keys) {
        const result = await this.storage.get(key);
        if (result.success) {
          portfolios.push(result.data);
        }
      }

      return {
        success: true,
        data: portfolios.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()),
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: new StorageError('PORTFOLIO_LIST_ERROR', 'Failed to retrieve portfolios', error),
        timestamp: new Date()
      };
    }
  }

  async deletePortfolio(portfolioId: string): Promise<StorageResult<void>> {
    const key = createStorageKey(this.namespace, portfolioId);
    return this.storage.remove(key);
  }

  async exportPortfolios(): Promise<StorageResult<string>> {
    const portfoliosResult = await this.getAllPortfolios();
    
    if (!portfoliosResult.success) {
      return portfoliosResult as any;
    }

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      portfolios: portfoliosResult.data,
      metadata: {
        count: portfoliosResult.data.length,
        source: 'FinancialRiskAnalyzer'
      }
    };

    return {
      success: true,
      data: JSON.stringify(exportData, null, 2),
      timestamp: new Date()
    };
  }

  async importPortfolios(jsonData: string, overwrite: boolean = false): Promise<StorageResult<{ imported: number; errors: string[] }>> {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.portfolios || !Array.isArray(importData.portfolios)) {
        throw new Error('Invalid import data format');
      }

      const results = { imported: 0, errors: [] as string[] };
      
      for (const portfolio of importData.portfolios) {
        try {
          if (!overwrite) {
            const exists = await this.getPortfolio(portfolio.id);
            if (exists.success) {
              results.errors.push(`Portfolio ${portfolio.id} already exists (skipped)`);
              continue;
            }
          }

          const saveResult = await this.savePortfolio(portfolio.id, portfolio);
          if (saveResult.success) {
            results.imported++;
          } else {
            results.errors.push(`Failed to import ${portfolio.id}: ${saveResult.error.message}`);
          }
        } catch (error) {
          results.errors.push(`Error importing portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: true,
        data: results,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: new StorageError('IMPORT_ERROR', 'Failed to import portfolios', error),
        timestamp: new Date()
      };
    }
  }
}

/**
 * Market Data Cache Service
 * Handles market data caching with TTL and compression
 */
export class MarketDataCacheService {
  private storage: AsyncStorageService;
  private namespace = STORAGE_NAMESPACES.MARKET_DATA;

  constructor(storage: AsyncStorageService) {
    this.storage = storage;
  }

  async cacheQuote(symbol: string, quote: any, ttl: number = 60000): Promise<StorageResult<void>> {
    const key = createStorageKey(this.namespace, `quote:${symbol}`);
    return this.storage.set(key, quote, { ttl, compress: true });
  }

  async getQuote(symbol: string): Promise<StorageResult<any>> {
    const key = createStorageKey(this.namespace, `quote:${symbol}`);
    return this.storage.get(key);
  }

  async cacheHistoricalData(symbol: string, interval: string, data: any, ttl: number = 3600000): Promise<StorageResult<void>> {
    const key = createStorageKey(this.namespace, `historical:${symbol}:${interval}`);
    return this.storage.set(key, data, { ttl, compress: true });
  }

  async getHistoricalData(symbol: string, interval: string): Promise<StorageResult<any>> {
    const key = createStorageKey(this.namespace, `historical:${symbol}:${interval}`);
    return this.storage.get(key);
  }

  async clearSymbolCache(symbol: string): Promise<void> {
    const pattern = `${this.namespace}:.*:${symbol}.*`;
    await this.storage.clear(pattern);
  }

  async clearExpiredCache(): Promise<void> {
    await this.storage.cleanup();
  }

  async getCacheStats(): Promise<any> {
    const stats = await this.storage.getStats();
    const keys = await this.storage.getKeys(`${this.namespace}:`);
    
    const quoteKeys = keys.filter(k => k.includes(':quote:'));
    const historicalKeys = keys.filter(k => k.includes(':historical:'));
    
    return {
      ...stats,
      quotesCount: quoteKeys.length,
      historicalCount: historicalKeys.length,
      totalMarketDataEntries: keys.length
    };
  }
}

/**
 * User Preferences Storage Service
 * Handles user settings and preferences
 */
export class UserPreferencesService {
  private storage: AsyncStorageService;
  private namespace = STORAGE_NAMESPACES.USER_PREFERENCES;

  constructor(storage: AsyncStorageService) {
    this.storage = storage;
  }

  async savePreferences(userId: string, preferences: any): Promise<StorageResult<void>> {
    const key = createStorageKey(this.namespace, userId);
    return this.storage.set(key, {
      ...preferences,
      lastUpdated: new Date()
    }, { encrypt: true });
  }

  async getPreferences(userId: string): Promise<StorageResult<any>> {
    const key = createStorageKey(this.namespace, userId);
    return this.storage.get(key);
  }

  async updatePreference(userId: string, path: string, value: any): Promise<StorageResult<void>> {
    const prefsResult = await this.getPreferences(userId);
    
    if (!prefsResult.success) {
      return prefsResult as any;
    }

    const preferences = prefsResult.data || {};
    
    // Set nested property using path (e.g., 'ui.theme')
    const pathParts = path.split('.');
    let current = preferences;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[pathParts[pathParts.length - 1]] = value;
    
    return this.savePreferences(userId, preferences);
  }

  async getPreference(userId: string, path: string, defaultValue?: any): Promise<any> {
    const prefsResult = await this.getPreferences(userId);
    
    if (!prefsResult.success) {
      return defaultValue;
    }

    const preferences = prefsResult.data || {};
    
    // Get nested property using path
    const pathParts = path.split('.');
    let current = preferences;
    
    for (const part of pathParts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return defaultValue;
      }
    }
    
    return current;
  }
}

// ===========================================
// Main Storage Manager
// ===========================================

export class StorageManager {
  private baseStorage: AsyncStorageService;
  public readonly portfolios: PortfolioStorageService;
  public readonly marketData: MarketDataCacheService;
  public readonly userPreferences: UserPreferencesService;

  constructor(config?: Partial<StorageConfig>) {
    this.baseStorage = createAsyncStorageService(config);
    this.portfolios = new PortfolioStorageService(this.baseStorage);
    this.marketData = new MarketDataCacheService(this.baseStorage);
    this.userPreferences = new UserPreferencesService(this.baseStorage);
  }

  // Direct access to base storage for custom operations
  get storage(): AsyncStorageService {
    return this.baseStorage;
  }

  // Storage management operations
  async getTotalStats(): Promise<any> {
    const baseStats = await this.baseStorage.getStats();
    const marketDataStats = await this.marketData.getCacheStats();
    
    return {
      ...baseStats,
      marketData: marketDataStats,
      namespaces: Object.values(STORAGE_NAMESPACES)
    };
  }

  async performMaintenance(): Promise<void> {
    // Cleanup expired entries
    await this.baseStorage.cleanup();
    
    // Clear old market data cache
    await this.marketData.clearExpiredCache();
    
    // Compact storage if supported
    await this.baseStorage.compact();
  }

  async clearNamespace(namespace: StorageNamespace): Promise<void> {
    await this.baseStorage.clear(`${namespace}:`);
  }

  async exportAllData(): Promise<StorageResult<string>> {
    try {
      const exportData = await this.baseStorage.exportData();
      return exportData;
    } catch (error) {
      return {
        success: false,
        error: new StorageError('EXPORT_ALL_ERROR', 'Failed to export all data', error),
        timestamp: new Date()
      };
    }
  }

  async importAllData(jsonData: string, overwrite: boolean = false): Promise<StorageResult<void>> {
    try {
      const importResult = await this.baseStorage.importData(jsonData, overwrite);
      return importResult;
    } catch (error) {
      return {
        success: false,
        error: new StorageError('IMPORT_ALL_ERROR', 'Failed to import all data', error),
        timestamp: new Date()
      };
    }
  }
}

// ===========================================
// Singleton Instance
// ===========================================

let storageManagerInstance: StorageManager | null = null;

/**
 * Gets the singleton instance of the storage manager
 */
export function getStorageManager(): StorageManager {
  if (!storageManagerInstance) {
    storageManagerInstance = new StorageManager();
  }
  return storageManagerInstance;
}

/**
 * Reinitializes the storage manager with new configuration
 */
export function reinitializeStorageManager(config: Partial<StorageConfig>): StorageManager {
  storageManagerInstance = new StorageManager(config);
  return storageManagerInstance;
}

// ===========================================
// Convenience Functions
// ===========================================

export async function savePortfolio(portfolioId: string, portfolio: any): Promise<StorageResult<void>> {
  return getStorageManager().portfolios.savePortfolio(portfolioId, portfolio);
}

export async function getPortfolio(portfolioId: string): Promise<StorageResult<any>> {
  return getStorageManager().portfolios.getPortfolio(portfolioId);
}

export async function getAllPortfolios(): Promise<StorageResult<any[]>> {
  return getStorageManager().portfolios.getAllPortfolios();
}

export async function saveUserPreferences(userId: string, preferences: any): Promise<StorageResult<void>> {
  return getStorageManager().userPreferences.savePreferences(userId, preferences);
}

export async function getUserPreferences(userId: string): Promise<StorageResult<any>> {
  return getStorageManager().userPreferences.getPreferences(userId);
}

export async function cacheMarketQuote(symbol: string, quote: any, ttl?: number): Promise<StorageResult<void>> {
  return getStorageManager().marketData.cacheQuote(symbol, quote, ttl);
}

export async function getCachedQuote(symbol: string): Promise<StorageResult<any>> {
  return getStorageManager().marketData.getQuote(symbol);
}

// ===========================================
// Development & Debugging
// ===========================================

export async function getStorageDebugInfo(): Promise<any> {
  const manager = getStorageManager();
  
  return {
    stats: await manager.getTotalStats(),
    config: manager.storage.getConfig(),
    namespaces: STORAGE_NAMESPACES,
    integrity: await manager.storage.validateIntegrity()
  };
}

export async function performStorageMaintenance(): Promise<void> {
  const manager = getStorageManager();
  await manager.performMaintenance();
}

// ===========================================
// Default Export
// ===========================================

export default {
  StorageManager,
  getStorageManager,
  reinitializeStorageManager,
  savePortfolio,
  getPortfolio,
  getAllPortfolios,
  saveUserPreferences,
  getUserPreferences,
  cacheMarketQuote,
  getCachedQuote,
  getStorageDebugInfo,
  performStorageMaintenance,
  STORAGE_NAMESPACES
};