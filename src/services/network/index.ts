// ===========================================
// src/services/network/index.ts
// Network Monitoring & Connectivity Service
// ===========================================

import { AnalyticsService } from '../analytics';
import { AsyncStorageService } from '../storage/asyncStorage';

// ========================================
// Network Types & Interfaces
// ========================================

export interface NetworkState {
  isConnected: boolean;
  type: NetworkType;
  isInternetReachable: boolean;
  strength: NetworkStrength;
  speed: NetworkSpeed;
  latency: number;
  timestamp: Date;
}

export interface NetworkConfig {
  monitoringEnabled: boolean;
  pingInterval: number;
  timeoutDuration: number;
  retryAttempts: number;
  endpoints: string[];
  speedTestEnabled: boolean;
  adaptiveBehavior: boolean;
  offlineQueueEnabled: boolean;
}

export interface NetworkMetrics {
  uptime: number;
  downtime: number;
  averageLatency: number;
  averageSpeed: number;
  connectionChanges: number;
  dataUsage: DataUsage;
  qualityScore: number;
}

export interface DataUsage {
  cellular: number;
  wifi: number;
  total: number;
  period: 'daily' | 'weekly' | 'monthly';
}

export interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: Date;
  retryCount: number;
  priority: ActionPriority;
}

export interface NetworkEvent {
  type: NetworkEventType;
  timestamp: Date;
  previousState?: NetworkState;
  currentState: NetworkState;
  metadata?: Record<string, any>;
}

// ========================================
// Main Network Service
// ========================================

export class NetworkService {
  private static instance: NetworkService;
  private config: NetworkConfig;
  private storage: AsyncStorageService;
  private analytics: AnalyticsService;
  private currentState: NetworkState;
  private listeners: Set<NetworkEventListener> = new Set();
  private monitoringInterval?: NodeJS.Timer;
  private offlineQueue: OfflineAction[] = [];
  private metrics: NetworkMetrics;
  private eventHistory: NetworkEvent[] = [];

  private constructor(config: NetworkConfig) {
    this.config = config;
    this.storage = AsyncStorageService.getInstance();
    this.analytics = AnalyticsService.getInstance();
    
    this.currentState = {
      isConnected: false,
      type: 'unknown',
      isInternetReachable: false,
      strength: 'unknown',
      speed: { download: 0, upload: 0, ping: 0 },
      latency: 0,
      timestamp: new Date()
    };

    this.metrics = {
      uptime: 0,
      downtime: 0,
      averageLatency: 0,
      averageSpeed: 0,
      connectionChanges: 0,
      dataUsage: { cellular: 0, wifi: 0, total: 0, period: 'daily' },
      qualityScore: 0
    };

    this.initialize();
  }

  // ========================================
  // Singleton Pattern
  // ========================================

  public static getInstance(config?: NetworkConfig): NetworkService {
    if (!NetworkService.instance) {
      const defaultConfig: NetworkConfig = {
        monitoringEnabled: true,
        pingInterval: 30000, // 30 seconds
        timeoutDuration: 10000, // 10 seconds
        retryAttempts: 3,
        endpoints: [
          'https://www.google.com',
          'https://1.1.1.1',
          'https://8.8.8.8'
        ],
        speedTestEnabled: false,
        adaptiveBehavior: true,
        offlineQueueEnabled: true
      };

      NetworkService.instance = new NetworkService({ ...defaultConfig, ...config });
    }
    return NetworkService.instance;
  }

  // ========================================
  // Initialization
  // ========================================

  private async initialize(): Promise<void> {
    try {
      await this.loadStoredData();
      await this.checkInitialState();
      this.startMonitoring();
      this.setupNetworkListeners();
    } catch (error) {
      console.error('Network service initialization failed:', error);
      this.analytics.trackError(error as Error, 'error', { source: 'network_init' });
    }
  }

  private async loadStoredData(): Promise<void> {
    // Load offline queue
    const queueResult = await this.storage.get('network:offline_queue');
    if (queueResult.success) {
      this.offlineQueue = (queueResult.data as OfflineAction[]) || [];
    }

    // Load metrics
    const metricsResult = await this.storage.get('network:metrics');
    if (metricsResult.success) {
      this.metrics = { ...this.metrics, ...(metricsResult.data as NetworkMetrics) };
    }

    // Load event history
    const historyResult = await this.storage.get('network:event_history');
    if (historyResult.success) {
      this.eventHistory = (historyResult.data as NetworkEvent[]) || [];
    }
  }

  private setupNetworkListeners(): void {
    // This would be implemented with platform-specific APIs
    // For React Native: @react-native-community/netinfo
    // For web: navigator.onLine and online/offline events
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnlineEvent.bind(this));
      window.addEventListener('offline', this.handleOfflineEvent.bind(this));
    }
  }

  private handleOnlineEvent(): void {
    this.updateConnectionState(true);
  }

  private handleOfflineEvent(): void {
    this.updateConnectionState(false);
  }

  // ========================================
  // Network State Management
  // ========================================

  private async checkInitialState(): Promise<void> {
    const state = await this.getCurrentNetworkState();
    this.updateState(state);
  }

  private async getCurrentNetworkState(): Promise<NetworkState> {
    try {
      // Check basic connectivity
      const isConnected = await this.checkConnectivity();
      
      // Check internet reachability
      const isInternetReachable = isConnected ? await this.checkInternetReachability() : false;
      
      // Get network type and strength
      const type = await this.getNetworkType();
      const strength = await this.getSignalStrength();
      
      // Measure latency
      const latency = isInternetReachable ? await this.measureLatency() : 0;
      
      // Measure speed (if enabled)
      const speed = this.config.speedTestEnabled && isInternetReachable 
        ? await this.measureSpeed() 
        : { download: 0, upload: 0, ping: latency };

      return {
        isConnected,
        type,
        isInternetReachable,
        strength,
        speed,
        latency,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to get network state:', error);
      return {
        isConnected: false,
        type: 'unknown',
        isInternetReachable: false,
        strength: 'unknown',
        speed: { download: 0, upload: 0, ping: 0 },
        latency: 0,
        timestamp: new Date()
      };
    }
  }

  private async checkConnectivity(): Promise<boolean> {
    // Platform-specific connectivity check
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true; // Default to connected
  }

  private async checkInternetReachability(): Promise<boolean> {
    for (const endpoint of this.config.endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutDuration);
        
        const response = await fetch(endpoint, {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          return true;
        }
      } catch (error) {
        // Continue to next endpoint
        continue;
      }
    }
    return false;
  }

  private async getNetworkType(): Promise<NetworkType> {
    // This would be implemented with platform-specific APIs
    // For now, return a mock type
    return 'wifi';
  }

  private async getSignalStrength(): Promise<NetworkStrength> {
    // This would be implemented with platform-specific APIs
    // For now, return a mock strength
    return 'good';
  }

  private async measureLatency(): Promise<number> {
    const endpoint = this.config.endpoints[0];
    const startTime = performance.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutDuration);
      
      await fetch(endpoint, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      return performance.now() - startTime;
    } catch (error) {
      return 0;
    }
  }

  private async measureSpeed(): Promise<NetworkSpeed> {
    // Simplified speed test implementation
    // In production, you'd use a proper speed test service
    try {
      const testData = new ArrayBuffer(1024 * 1024); // 1MB test
      const startTime = performance.now();
      
      // Mock upload test
      const uploadTime = performance.now() - startTime;
      const upload = (1024 * 8) / (uploadTime / 1000); // Mbps
      
      // Mock download test  
      const downloadStart = performance.now();
      const response = await fetch(this.config.endpoints[0]);
      const downloadTime = performance.now() - downloadStart;
      const download = (1024 * 8) / (downloadTime / 1000); // Mbps
      
      return {
        download: Math.max(0, download),
        upload: Math.max(0, upload),
        ping: await this.measureLatency()
      };
    } catch (error) {
      return { download: 0, upload: 0, ping: 0 };
    }
  }

  // ========================================
  // State Updates & Events
  // ========================================

  private updateConnectionState(isConnected: boolean): void {
    if (this.currentState.isConnected !== isConnected) {
      const previousState = { ...this.currentState };
      this.currentState.isConnected = isConnected;
      this.currentState.timestamp = new Date();
      
      this.notifyStateChange(previousState, this.currentState);
      this.updateMetrics(previousState, this.currentState);
      
      if (isConnected) {
        this.handleReconnection();
      } else {
        this.handleDisconnection();
      }
    }
  }

  private updateState(newState: NetworkState): void {
    const previousState = { ...this.currentState };
    const stateChanged = this.hasStateChanged(previousState, newState);
    
    this.currentState = newState;
    
    if (stateChanged) {
      this.notifyStateChange(previousState, newState);
      this.updateMetrics(previousState, newState);
      this.recordEvent({
        type: 'state_change',
        timestamp: new Date(),
        previousState,
        currentState: newState
      });
    }
  }

  private hasStateChanged(previous: NetworkState, current: NetworkState): boolean {
    return (
      previous.isConnected !== current.isConnected ||
      previous.type !== current.type ||
      previous.isInternetReachable !== current.isInternetReachable ||
      previous.strength !== current.strength ||
      Math.abs(previous.latency - current.latency) > 100 // Significant latency change
    );
  }

  private notifyStateChange(previous: NetworkState, current: NetworkState): void {
    const event: NetworkEvent = {
      type: current.isConnected ? 'connected' : 'disconnected',
      timestamp: new Date(),
      previousState: previous,
      currentState: current
    };

    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Network event listener error:', error);
      }
    });

    this.analytics.track('network', 'state_change', current.isConnected ? 'connected' : 'disconnected', undefined, {
      previous_type: previous.type,
      current_type: current.type,
      latency: current.latency,
      reachable: current.isInternetReachable
    });
  }

  // ========================================
  // Monitoring
  // ========================================

  private startMonitoring(): void {
    if (!this.config.monitoringEnabled) return;

    this.monitoringInterval = setInterval(async () => {
      const state = await this.getCurrentNetworkState();
      this.updateState(state);
    }, this.config.pingInterval);
  }

  private stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval as unknown as number);
      this.monitoringInterval = undefined;
    }
  }

  // ========================================
  // Offline Queue Management
  // ========================================

  private handleDisconnection(): void {
    this.analytics.track('network', 'disconnected', this.currentState.type);
  }

  private async handleReconnection(): Promise<void> {
    this.analytics.track('network', 'reconnected', this.currentState.type);
    
    if (this.config.offlineQueueEnabled) {
      await this.processOfflineQueue();
    }
  }

  public addToOfflineQueue(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): void {
    if (!this.config.offlineQueueEnabled) return;

    const offlineAction: OfflineAction = {
      id: this.generateId(),
      timestamp: new Date(),
      retryCount: 0,
      ...action
    };

    this.offlineQueue.push(offlineAction);
    this.saveOfflineQueue();
  }

  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const action of queue) {
      try {
        await this.processOfflineAction(action);
        this.analytics.track('network', 'offline_action_processed', action.type);
      } catch (error) {
        action.retryCount++;
        
        if (action.retryCount <= this.config.retryAttempts) {
          this.offlineQueue.push(action);
        } else {
          this.analytics.trackError(error as Error, 'warning', {
            source: 'offline_queue',
            action_type: action.type,
            retry_count: action.retryCount
          });
        }
      }
    }

    await this.saveOfflineQueue();
  }

  private async processOfflineAction(action: OfflineAction): Promise<void> {
    // This would be implemented based on action types
    // For example, retry API calls, sync data, etc.
    console.log('Processing offline action:', action);
  }

  private async saveOfflineQueue(): Promise<void> {
    await this.storage.set('network:offline_queue', this.offlineQueue);
  }

  // ========================================
  // Metrics & Analytics
  // ========================================

  private updateMetrics(previous: NetworkState, current: NetworkState): void {
    const now = Date.now();
    const timeDiff = now - previous.timestamp.getTime();

    // Update uptime/downtime
    if (previous.isConnected) {
      this.metrics.uptime += timeDiff;
    } else {
      this.metrics.downtime += timeDiff;
    }

    // Update connection changes
    if (previous.isConnected !== current.isConnected) {
      this.metrics.connectionChanges++;
    }

    // Update latency average
    if (current.latency > 0) {
      this.metrics.averageLatency = (this.metrics.averageLatency + current.latency) / 2;
    }

    // Update speed average
    if (current.speed.download > 0) {
      this.metrics.averageSpeed = (this.metrics.averageSpeed + current.speed.download) / 2;
    }

    // Calculate quality score
    this.metrics.qualityScore = this.calculateQualityScore(current);

    this.saveMetrics();
  }

  private calculateQualityScore(state: NetworkState): number {
    if (!state.isConnected || !state.isInternetReachable) return 0;

    let score = 100;

    // Deduct points for high latency
    if (state.latency > 1000) score -= 30;
    else if (state.latency > 500) score -= 15;
    else if (state.latency > 200) score -= 5;

    // Deduct points for poor signal strength
    switch (state.strength) {
      case 'poor':
        score -= 20;
        break;
      case 'fair':
        score -= 10;
        break;
      case 'good':
        score -= 0;
        break;
      case 'excellent':
        score += 5;
        break;
    }

    // Deduct points for slow speed
    if (state.speed.download < 1) score -= 25;
    else if (state.speed.download < 5) score -= 15;
    else if (state.speed.download < 10) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  private recordEvent(event: NetworkEvent): void {
    this.eventHistory.push(event);
    
    // Keep only last 100 events
    if (this.eventHistory.length > 100) {
      this.eventHistory = this.eventHistory.slice(-100);
    }
    
    this.saveEventHistory();
  }

  private async saveMetrics(): Promise<void> {
    await this.storage.set('network:metrics', this.metrics);
  }

  private async saveEventHistory(): Promise<void> {
    await this.storage.set('network:event_history', this.eventHistory);
  }

  // ========================================
  // Public API
  // ========================================

  public getState(): NetworkState {
    return { ...this.currentState };
  }

  public isConnected(): boolean {
    return this.currentState.isConnected && this.currentState.isInternetReachable;
  }

  public getMetrics(): NetworkMetrics {
    return { ...this.metrics };
  }

  public getEventHistory(): NetworkEvent[] {
    return [...this.eventHistory];
  }

  public addEventListener(listener: NetworkEventListener): void {
    this.listeners.add(listener);
  }

  public removeEventListener(listener: NetworkEventListener): void {
    this.listeners.delete(listener);
  }

  public async forceCheck(): Promise<NetworkState> {
    const state = await this.getCurrentNetworkState();
    this.updateState(state);
    return state;
  }

  public getQualityScore(): number {
    return this.metrics.qualityScore;
  }

  public shouldUseCache(): boolean {
    if (!this.config.adaptiveBehavior) return false;
    
    return (
      !this.isConnected() ||
      this.currentState.latency > 2000 ||
      this.currentState.strength === 'poor'
    );
  }

  public shouldReduceQuality(): boolean {
    if (!this.config.adaptiveBehavior) return false;
    
    return (
      this.currentState.type === 'cellular' &&
      (this.currentState.strength === 'poor' || this.currentState.speed.download < 1)
    );
  }

  // ========================================
  // Configuration
  // ========================================

  public updateConfig(config: Partial<NetworkConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.monitoringEnabled && !this.monitoringInterval) {
      this.startMonitoring();
    } else if (!this.config.monitoringEnabled && this.monitoringInterval) {
      this.stopMonitoring();
    }
  }

  public getConfig(): NetworkConfig {
    return { ...this.config };
  }

  // ========================================
  // Utility Methods
  // ========================================

  private generateId(): string {
    return `network_action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ========================================
  // Cleanup
  // ========================================

  public dispose(): void {
    this.stopMonitoring();
    this.listeners.clear();
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnlineEvent);
      window.removeEventListener('offline', this.handleOfflineEvent);
    }
  }
}

// ========================================
// Type Definitions
// ========================================

export type NetworkType = 
  | 'wifi' 
  | 'cellular' 
  | 'ethernet' 
  | 'bluetooth' 
  | 'unknown';

export type NetworkStrength = 
  | 'poor' 
  | 'fair' 
  | 'good' 
  | 'excellent' 
  | 'unknown';

export interface NetworkSpeed {
  download: number; // Mbps
  upload: number;   // Mbps
  ping: number;     // ms
}

export type ActionPriority = 
  | 'low' 
  | 'normal' 
  | 'high' 
  | 'critical';

export type NetworkEventType = 
  | 'connected' 
  | 'disconnected' 
  | 'state_change' 
  | 'speed_change' 
  | 'type_change';

export type NetworkEventListener = (event: NetworkEvent) => void;

// ========================================
// Factory Function
// ========================================

export function createNetworkService(config?: Partial<NetworkConfig>): NetworkService {
  return NetworkService.getInstance(config as NetworkConfig);
}

// ========================================
// Default Export
// ========================================

export default NetworkService;