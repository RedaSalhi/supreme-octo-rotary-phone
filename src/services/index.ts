// ===========================================
// src/services/index.ts
// Main Services Index & Coordination
// ===========================================

// ========================================
// Service Exports
// ========================================

// API Services
export * from './api';
export { 
  getApiService, 
  createApiService, 
  getQuote, 
  getHistoricalData, 
  searchSymbols 
} from './api';

// Storage Services
export * from './storage';
export { 
  getStorageManager, 
  savePortfolio, 
  getPortfolio, 
  saveUserPreferences 
} from './storage';

// Analytics Services
export * from './analytics';
export { 
  getAnalyticsManager, 
  track, 
  trackScreen, 
  trackError 
} from './analytics';

// Notification Services
export { NotificationService, createNotificationService } from './notifications';

// Network Services
export { NetworkService, createNetworkService } from './network';

// ========================================
// Service Configuration Types
// ========================================

export interface ServicesConfig {
  api?: {
    primaryProvider?: string;
    apiKeys?: Record<string, string>;
    enabledProviders?: string[];
    cachingEnabled?: boolean;
    offlineMode?: boolean;
  };
  storage?: {
    encryptionEnabled?: boolean;
    compressionEnabled?: boolean;
    maxStorageSize?: number;
    cacheTTL?: number;
    syncEnabled?: boolean;
    backupEnabled?: boolean;
  };
  analytics?: {
    enabled?: boolean;
    collectPersonalInfo?: boolean;
    collectPerformanceMetrics?: boolean;
    collectErrorReports?: boolean;
    debugMode?: boolean;
  };
  notifications?: {
    enabled?: boolean;
    pushEnabled?: boolean;
    soundEnabled?: boolean;
    alertsEnabled?: boolean;
  };
  network?: {
    monitoringEnabled?: boolean;
    adaptiveBehavior?: boolean;
    offlineQueueEnabled?: boolean;
  };
}

export interface ServiceStatus {
  name: string;
  status: 'initializing' | 'ready' | 'error' | 'disabled';
  error?: string;
  lastCheck?: Date;
  health?: number; // 0-100
}

export interface ServicesHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  services: ServiceStatus[];
  timestamp: Date;
}

// ========================================
// Services Manager Class
// ========================================

export class ServicesManager {
  private static instance: ServicesManager;
  private config: ServicesConfig;
  private initialized = false;
  private serviceStatuses: Map<string, ServiceStatus> = new Map();
  private healthCheckInterval?: NodeJS.Timer;

  // Service instances
  private apiService?: any;
  private storageManager?: any;
  private analyticsManager?: any;
  private notificationService?: any;
  private networkService?: any;

  private constructor(config: ServicesConfig = {}) {
    this.config = config;
    this.initializeServiceStatuses();
  }

  // ========================================
  // Singleton Pattern
  // ========================================

  public static getInstance(config?: ServicesConfig): ServicesManager {
    if (!ServicesManager.instance) {
      ServicesManager.instance = new ServicesManager(config);
    }
    return ServicesManager.instance;
  }

  // ========================================
  // Initialization
  // ========================================

  public async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('Services already initialized');
      return;
    }

    console.log('🚀 Initializing Financial Risk Analyzer Services...');

    try {
      // Initialize services in dependency order
      await this.initializeStorage();
      await this.initializeAnalytics();
      await this.initializeNetwork();
      await this.initializeApi();
      await this.initializeNotifications();

      // Start health monitoring
      this.startHealthMonitoring();

      this.initialized = true;
      console.log('✅ All services initialized successfully');

      // Track initialization
      this.trackEvent('services', 'initialized', 'success');

    } catch (error) {
      console.error('❌ Services initialization failed:', error);
      this.trackError(error as Error, 'critical', { source: 'services_init' });
      throw error;
    }
  }

  private initializeServiceStatuses(): void {
    const services = ['storage', 'analytics', 'network', 'api', 'notifications'];
    services.forEach(service => {
      this.serviceStatuses.set(service, {
        name: service,
        status: 'initializing',
        lastCheck: new Date()
      });
    });
  }

  // ========================================
  // Individual Service Initialization
  // ========================================

  private async initializeStorage(): Promise<void> {
    try {
      console.log('📦 Initializing Storage Service...');
      
      const { getStorageManager } = await import('./storage');
      this.storageManager = getStorageManager();
      
      // Perform maintenance on startup
      await this.storageManager.performMaintenance();
      
      this.updateServiceStatus('storage', 'ready', 100);
      console.log('✅ Storage Service ready');
    } catch (error) {
      this.updateServiceStatus('storage', 'error', 0, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async initializeAnalytics(): Promise<void> {
    try {
      console.log('📊 Initializing Analytics Service...');
      
      const { getAnalyticsManager } = await import('./analytics');
      this.analyticsManager = getAnalyticsManager();
      
      // Set initial configuration
      this.analyticsManager.analytics.updateConfig(this.config.analytics || {});
      
      this.updateServiceStatus('analytics', 'ready', 100);
      console.log('✅ Analytics Service ready');
    } catch (error) {
      this.updateServiceStatus('analytics', 'error', 0, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async initializeNetwork(): Promise<void> {
    try {
      console.log('🌐 Initializing Network Service...');
      
      const { createNetworkService } = await import('./network');
      this.networkService = createNetworkService(this.config.network);
      
      // Set up network event handling
      this.networkService.addEventListener((event: any) => {
        this.handleNetworkEvent(event);
      });
      
      this.updateServiceStatus('network', 'ready', 100);
      console.log('✅ Network Service ready');
    } catch (error) {
      this.updateServiceStatus('network', 'error', 0, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async initializeApi(): Promise<void> {
    try {
      console.log('🔌 Initializing API Service...');
      
      const { createApiService } = await import('./api');
      this.apiService = createApiService(this.config.api);
      
      // Validate API configuration
      const validation = await this.validateApiConfiguration();
      if (!validation.valid) {
        console.warn('⚠️ API configuration issues:', validation.recommendations);
      }
      
      this.updateServiceStatus('api', 'ready', validation.valid ? 100 : 50);
      console.log('✅ API Service ready');
    } catch (error) {
      this.updateServiceStatus('api', 'error', 0, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async initializeNotifications(): Promise<void> {
    try {
      console.log('🔔 Initializing Notification Service...');
      
      const { createNotificationService } = await import('./notifications');
      this.notificationService = createNotificationService(this.config.notifications);
      
      this.updateServiceStatus('notifications', 'ready', 100);
      console.log('✅ Notification Service ready');
    } catch (error) {
      this.updateServiceStatus('notifications', 'error', 0, error instanceof Error ? error.message : 'Unknown error');
      // Don't throw - notifications are not critical
      console.warn('⚠️ Notification Service failed to initialize, continuing without notifications');
    }
  }

  // ========================================
  // Service Access Methods
  // ========================================

  public getApiService(): any {
    this.ensureInitialized();
    return this.apiService;
  }

  public getStorageManager(): any {
    this.ensureInitialized();
    return this.storageManager;
  }

  public getAnalyticsManager(): any {
    this.ensureInitialized();
    return this.analyticsManager;
  }

  public getNotificationService(): any {
    this.ensureInitialized();
    return this.notificationService;
  }

  public getNetworkService(): any {
    this.ensureInitialized();
    return this.networkService;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Services not initialized. Call ServicesManager.initialize() first.');
    }
  }

  // ========================================
  // Health Monitoring
  // ========================================

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 60000); // Check every minute
  }

  private async performHealthCheck(): Promise<void> {
    try {
      // Check API service health
      if (this.apiService) {
        const apiHealth = await this.checkApiHealth();
        this.updateServiceStatus('api', apiHealth.status, apiHealth.health);
      }

      // Check storage service health
      if (this.storageManager) {
        const storageHealth = await this.checkStorageHealth();
        this.updateServiceStatus('storage', storageHealth.status, storageHealth.health);
      }

      // Check network service health
      if (this.networkService) {
        const networkHealth = this.checkNetworkHealth();
        this.updateServiceStatus('network', networkHealth.status, networkHealth.health);
      }

      // Check analytics service health
      if (this.analyticsManager) {
        const analyticsHealth = this.checkAnalyticsHealth();
        this.updateServiceStatus('analytics', analyticsHealth.status, analyticsHealth.health);
      }

      // Check notifications service health
      if (this.notificationService) {
        const notificationsHealth = this.checkNotificationsHealth();
        this.updateServiceStatus('notifications', notificationsHealth.status, notificationsHealth.health);
      }

    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  private async checkApiHealth(): Promise<{ status: ServiceStatus['status']; health: number }> {
    try {
      const providerStatus = this.apiService.getProviderStatus();
      const healthyProviders = Array.from(providerStatus.values()).filter(p => p.status === 'online');
      const health = (healthyProviders.length / providerStatus.size) * 100;
      
      return {
        status: health > 0 ? 'ready' : 'error',
        health
      };
    } catch (error) {
      return { status: 'error', health: 0 };
    }
  }

  private async checkStorageHealth(): Promise<{ status: ServiceStatus['status']; health: number }> {
    try {
      const stats = await this.storageManager.getTotalStats();
      const health = stats.entryCount > 0 ? 100 : 80; // Lower if no data
      
      return {
        status: 'ready',
        health
      };
    } catch (error) {
      return { status: 'error', health: 0 };
    }
  }

  private checkNetworkHealth(): { status: ServiceStatus['status']; health: number } {
    try {
      const networkState = this.networkService.getState();
      const qualityScore = this.networkService.getQualityScore();
      
      return {
        status: networkState.isConnected ? 'ready' : 'error',
        health: qualityScore
      };
    } catch (error) {
      return { status: 'error', health: 0 };
    }
  }

  private checkAnalyticsHealth(): { status: ServiceStatus['status']; health: number } {
    try {
      const config = this.analyticsManager.analytics.getConfig();
      return {
        status: config.enabled ? 'ready' : 'disabled',
        health: config.enabled ? 100 : 0
      };
    } catch (error) {
      return { status: 'error', health: 0 };
    }
  }

  private checkNotificationsHealth(): { status: ServiceStatus['status']; health: number } {
    try {
      const permissions = this.notificationService.getPermissions();
      const health = permissions.status === 'granted' ? 100 : 50;
      
      return {
        status: 'ready',
        health
      };
    } catch (error) {
      return { status: 'error', health: 0 };
    }
  }

  // ========================================
  // Event Handling
  // ========================================

  private handleNetworkEvent(event: any): void {
    // Update analytics with network changes
    if (this.analyticsManager) {
      this.analyticsManager.setOnlineStatus(event.currentState.isConnected);
    }

    // Handle API service network changes
    if (this.apiService && event.type === 'connected') {
      // Could trigger cache sync or retry failed requests
    }
  }

  // ========================================
  // Utility Methods
  // ========================================

  private updateServiceStatus(
    serviceName: string, 
    status: ServiceStatus['status'], 
    health?: number, 
    error?: string
  ): void {
    this.serviceStatuses.set(serviceName, {
      name: serviceName,
      status,
      health,
      error,
      lastCheck: new Date()
    });
  }

  private async validateApiConfiguration(): Promise<any> {
    try {
      const { validateConfiguration } = await import('./api');
      return await validateConfiguration();
    } catch (error) {
      return { valid: false, providers: [], recommendations: ['Failed to validate API configuration'] };
    }
  }

  // ========================================
  // Public API
  // ========================================

  public getServicesHealth(): ServicesHealth {
    const services = Array.from(this.serviceStatuses.values());
    const healthyServices = services.filter(s => s.status === 'ready' && (s.health || 0) > 50);
    const criticalServices = services.filter(s => s.status === 'error' || (s.health || 0) < 25);
    
    let overall: ServicesHealth['overall'] = 'healthy';
    if (criticalServices.length > 0) {
      overall = 'critical';
    } else if (healthyServices.length < services.length) {
      overall = 'degraded';
    }

    return {
      overall,
      services,
      timestamp: new Date()
    };
  }

  public async restart(serviceName?: string): Promise<void> {
    if (serviceName) {
      await this.restartService(serviceName);
    } else {
      await this.restartAllServices();
    }
  }

  private async restartService(serviceName: string): Promise<void> {
    console.log(`🔄 Restarting ${serviceName} service...`);
    
    try {
      switch (serviceName) {
        case 'api':
          await this.initializeApi();
          break;
        case 'storage':
          await this.initializeStorage();
          break;
        case 'analytics':
          await this.initializeAnalytics();
          break;
        case 'network':
          await this.initializeNetwork();
          break;
        case 'notifications':
          await this.initializeNotifications();
          break;
        default:
          throw new Error(`Unknown service: ${serviceName}`);
      }
      
      console.log(`✅ ${serviceName} service restarted successfully`);
    } catch (error) {
      console.error(`❌ Failed to restart ${serviceName} service:`, error);
      throw error;
    }
  }

  private async restartAllServices(): Promise<void> {
    console.log('🔄 Restarting all services...');
    
    this.initialized = false;
    await this.initialize();
    
    console.log('✅ All services restarted successfully');
  }

  public updateConfiguration(config: Partial<ServicesConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update individual service configurations
    if (config.analytics && this.analyticsManager) {
      this.analyticsManager.analytics.updateConfig(config.analytics);
    }
    
    if (config.network && this.networkService) {
      this.networkService.updateConfig(config.network);
    }
    
    if (config.notifications && this.notificationService) {
      this.notificationService.updateConfig(config.notifications);
    }
  }

  public getConfiguration(): ServicesConfig {
    return { ...this.config };
  }

  // ========================================
  // Convenience Methods
  // ========================================

  private trackEvent(category: string, action: string, label: string): void {
    try {
      this.analyticsManager?.track(category, action, label);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  private trackError(error: Error, severity: string, context: any): void {
    try {
      this.analyticsManager?.trackError(error, severity, context);
    } catch (trackingError) {
      console.error('Failed to track error:', trackingError);
    }
  }

  // ========================================
  // Cleanup
  // ========================================

  public dispose(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Dispose individual services
    try {
      this.networkService?.dispose();
      this.analyticsManager?.dispose();
      this.notificationService?.dispose();
    } catch (error) {
      console.error('Error during services disposal:', error);
    }

    this.initialized = false;
    console.log('🧹 Services disposed');
  }
}

// ========================================
// Global Services Instance
// ========================================

let globalServicesManager: ServicesManager | null = null;

/**
 * Gets the global services manager instance
 */
export function getServicesManager(): ServicesManager {
  if (!globalServicesManager) {
    globalServicesManager = ServicesManager.getInstance();
  }
  return globalServicesManager;
}

/**
 * Initializes all services with the provided configuration
 */
export async function initializeServices(config?: ServicesConfig): Promise<ServicesManager> {
  const manager = ServicesManager.getInstance(config);
  await manager.initialize();
  globalServicesManager = manager;
  return manager;
}

/**
 * Reinitializes services with new configuration
 */
export async function reinitializeServices(config: ServicesConfig): Promise<ServicesManager> {
  if (globalServicesManager) {
    globalServicesManager.dispose();
  }
  return await initializeServices(config);
}

// ========================================
// Quick Access Functions
// ========================================

export function useApiService(): any {
  return getServicesManager().getApiService();
}

export function useStorageManager(): any {
  return getServicesManager().getStorageManager();
}

export function useAnalyticsManager(): any {
  return getServicesManager().getAnalyticsManager();
}

export function useNotificationService(): any {
  return getServicesManager().getNotificationService();
}

export function useNetworkService(): any {
  return getServicesManager().getNetworkService();
}

// ========================================
// Development Utilities
// ========================================

export async function getServicesDebugInfo(): Promise<any> {
  const manager = getServicesManager();
  const health = manager.getServicesHealth();
  
  try {
    const apiDebug = await manager.getApiService()?.getDebugInfo?.();
    const storageDebug = await manager.getStorageManager()?.getStorageDebugInfo?.();
    const networkState = manager.getNetworkService()?.getState?.();
    
    return {
      health,
      configuration: manager.getConfiguration(),
      apiService: apiDebug,
      storageService: storageDebug,
      networkService: { state: networkState },
      timestamp: new Date()
    };
  } catch (error) {
    return {
      health,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    };
  }
}

export function logServicesStatus(): void {
  const manager = getServicesManager();
  const health = manager.getServicesHealth();
  
  console.group('📋 Services Status');
  console.log(`Overall Health: ${health.overall}`);
  
  health.services.forEach(service => {
    const emoji = service.status === 'ready' ? '✅' : 
                  service.status === 'error' ? '❌' : 
                  service.status === 'disabled' ? '⏸️' : '⏳';
    
    console.log(`${emoji} ${service.name}: ${service.status} (${service.health || 0}%)`);
    if (service.error) {
      console.log(`   Error: ${service.error}`);
    }
  });
  
  console.groupEnd();
}

// ========================================
// Default Export
// ========================================

export default {
  ServicesManager,
  getServicesManager,
  initializeServices,
  reinitializeServices,
  useApiService,
  useStorageManager,
  useAnalyticsManager,
  useNotificationService,
  useNetworkService,
  getServicesDebugInfo,
  logServicesStatus
};