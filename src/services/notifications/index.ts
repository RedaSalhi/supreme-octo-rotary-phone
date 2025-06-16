// ===========================================
// src/services/notifications/index.ts
// Notification Service - Push Notifications & Alerts
// ===========================================

import { AsyncStorageService } from '../storage/asyncStorage';
import { AnalyticsService } from '../analytics';

// ========================================
// Notification Types & Interfaces
// ========================================

export interface NotificationConfig {
  enabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeEnabled: boolean;
  alertsEnabled: boolean;
  schedulingEnabled: boolean;
  endpoints: {
    registration?: string;
    send?: string;
    webhook?: string;
  };
  channels: NotificationChannel[];
}

export interface NotificationChannel {
  id: string;
  name: string;
  description: string;
  importance: 'low' | 'normal' | 'high' | 'critical';
  sound?: string;
  vibrationPattern?: number[];
  lightColor?: string;
  enabled: boolean;
}

export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  sound?: string;
  badge?: number;
  icon?: string;
  image?: string;
  actions?: NotificationAction[];
  scheduledFor?: Date;
  channelId?: string;
  tags?: string[];
}

export interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
  input?: boolean;
  destructive?: boolean;
}

export interface ScheduledNotification extends NotificationPayload {
  triggerAt: Date;
  repeat?: NotificationRepeat;
  condition?: NotificationCondition;
}

export interface NotificationRepeat {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval?: number;
  daysOfWeek?: number[];
  endDate?: Date;
}

export interface NotificationCondition {
  type: 'price_alert' | 'portfolio_change' | 'market_hours' | 'custom';
  parameters: Record<string, any>;
}

export interface NotificationPermissions {
  status: 'granted' | 'denied' | 'default';
  alert: boolean;
  badge: boolean;
  sound: boolean;
  criticalAlert?: boolean;
  provisional?: boolean;
}

// ========================================
// Alert System Types
// ========================================

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  symbol?: string;
  currentValue?: number;
  targetValue?: number;
  triggerCondition: AlertCondition;
  createdAt: Date;
  triggeredAt?: Date;
  acknowledged?: boolean;
  dismissed?: boolean;
  metadata?: Record<string, any>;
}

export interface AlertCondition {
  operator: 'above' | 'below' | 'equals' | 'change_percent' | 'change_absolute';
  value: number;
  timeframe?: string;
}

export interface PriceAlert extends Alert {
  symbol: string;
  currentPrice: number;
  targetPrice: number;
  direction: 'up' | 'down';
}

export interface PortfolioAlert extends Alert {
  portfolioId: string;
  metric: 'value' | 'return' | 'risk' | 'drawdown';
  threshold: number;
}

// ========================================
// Main Notification Service
// ========================================

export class NotificationService {
  private static instance: NotificationService;
  private config: NotificationConfig;
  private storage: AsyncStorageService;
  private analytics: AnalyticsService;
  private permissions: NotificationPermissions = {
    status: 'default',
    alert: false,
    badge: false,
    sound: false
  };
  private scheduledNotifications: Map<string, any> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private registrationToken?: string;

  private constructor(config: NotificationConfig) {
    this.config = config;
    this.storage = AsyncStorageService.getInstance();
    this.analytics = AnalyticsService.getInstance();
    this.initialize();
  }

  // ========================================
  // Singleton Pattern
  // ========================================

  public static getInstance(config?: NotificationConfig): NotificationService {
    if (!NotificationService.instance) {
      const defaultConfig: NotificationConfig = {
        enabled: true,
        pushEnabled: true,
        emailEnabled: false,
        soundEnabled: true,
        vibrationEnabled: true,
        badgeEnabled: true,
        alertsEnabled: true,
        schedulingEnabled: true,
        endpoints: {},
        channels: [
          {
            id: 'portfolio_alerts',
            name: 'Portfolio Alerts',
            description: 'Important portfolio and risk notifications',
            importance: 'high',
            enabled: true
          },
          {
            id: 'price_alerts',
            name: 'Price Alerts',
            description: 'Stock price and market notifications',
            importance: 'normal',
            enabled: true
          },
          {
            id: 'system_notifications',
            name: 'System Notifications',
            description: 'App updates and system messages',
            importance: 'low',
            enabled: true
          }
        ]
      };

      NotificationService.instance = new NotificationService({ ...defaultConfig, ...config });
    }
    return NotificationService.instance;
  }

  // ========================================
  // Initialization
  // ========================================

  private async initialize(): Promise<void> {
    try {
      await this.loadStoredData();
      await this.requestPermissions();
      await this.registerForPushNotifications();
      this.setupNotificationHandlers();
      this.startAlertMonitoring();
    } catch (error) {
      console.error('Notification service initialization failed:', error);
      this.analytics.trackError(error as Error, 'error', { source: 'notifications' });
    }
  }

  private async loadStoredData(): Promise<void> {
    // Load scheduled notifications
    const scheduledResult = await this.storage.get('notifications:scheduled');
    if (scheduledResult.success) {
      const scheduled = scheduledResult.data || [];
      scheduled.forEach((notification: ScheduledNotification) => {
        this.scheduledNotifications.set(notification.id, notification);
      });
    }

    // Load active alerts
    const alertsResult = await this.storage.get('notifications:alerts');
    if (alertsResult.success) {
      const alerts = alertsResult.data || [];
      alerts.forEach((alert: Alert) => {
        this.activeAlerts.set(alert.id, alert);
      });
    }

    // Load permissions
    const permissionsResult = await this.storage.get('notifications:permissions');
    if (permissionsResult.success) {
      this.permissions = { ...this.permissions, ...permissionsResult.data };
    }
  }

  private setupNotificationHandlers(): void {
    // This would be implemented with platform-specific APIs
    // For React Native, you'd use libraries like @react-native-firebase/messaging
    // or expo-notifications
  }

  // ========================================
  // Permission Management
  // ========================================

  async requestPermissions(): Promise<NotificationPermissions> {
    try {
      // This would be implemented with platform-specific permission APIs
      // For now, simulate permission request
      const mockPermissions: NotificationPermissions = {
        status: 'granted',
        alert: true,
        badge: true,
        sound: true
      };

      this.permissions = mockPermissions;
      await this.storage.set('notifications:permissions', this.permissions);

      this.analytics.track('notification', 'permissions_requested', this.permissions.status);

      return this.permissions;
    } catch (error) {
      this.analytics.trackError(error as Error, 'warning', { source: 'permissions' });
      return this.permissions;
    }
  }

  getPermissions(): NotificationPermissions {
    return { ...this.permissions };
  }

  async updatePermissions(permissions: Partial<NotificationPermissions>): Promise<void> {
    this.permissions = { ...this.permissions, ...permissions };
    await this.storage.set('notifications:permissions', this.permissions);
  }

  // ========================================
  // Push Notification Registration
  // ========================================

  private async registerForPushNotifications(): Promise<void> {
    if (!this.config.pushEnabled || this.permissions.status !== 'granted') {
      return;
    }

    try {
      // This would be implemented with platform-specific APIs
      // Mock token generation
      this.registrationToken = `mock_token_${Date.now()}`;
      
      await this.storage.set('notifications:registration_token', this.registrationToken);

      // Send token to backend if endpoint is configured
      if (this.config.endpoints.registration && this.registrationToken) {
        await this.sendRegistrationToServer(this.registrationToken);
      }

      this.analytics.track('notification', 'registration_success', 'push_notifications');
    } catch (error) {
      console.error('Push notification registration failed:', error);
      this.analytics.trackError(error as Error, 'warning', { source: 'push_registration' });
    }
  }

  private async sendRegistrationToServer(token: string): Promise<void> {
    if (!this.config.endpoints.registration) return;

    try {
      await fetch(this.config.endpoints.registration, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          platform: 'mobile', // Would detect actual platform
          appVersion: '1.0.0',
          userId: 'current_user_id' // Would get from user service
        })
      });
    } catch (error) {
      console.error('Failed to send registration token to server:', error);
    }
  }

  // ========================================
  // Notification Channels
  // ========================================

  async createChannel(channel: NotificationChannel): Promise<void> {
    // Platform-specific channel creation would go here
    this.config.channels.push(channel);
    await this.storage.set('notifications:channels', this.config.channels);
  }

  async updateChannel(channelId: string, updates: Partial<NotificationChannel>): Promise<void> {
    const channelIndex = this.config.channels.findIndex(c => c.id === channelId);
    if (channelIndex >= 0) {
      this.config.channels[channelIndex] = { ...this.config.channels[channelIndex], ...updates };
      await this.storage.set('notifications:channels', this.config.channels);
    }
  }

  getChannels(): NotificationChannel[] {
    return [...this.config.channels];
  }

  // ========================================
  // Send Notifications
  // ========================================

  async sendNotification(payload: NotificationPayload): Promise<void> {
    if (!this.config.enabled || this.permissions.status !== 'granted') {
      return;
    }

    try {
      // Add default values
      const notification: NotificationPayload = {
        id: payload.id || this.generateId(),
        ...payload,
        channelId: payload.channelId || 'system_notifications'
      };

      // Platform-specific notification display would go here
      await this.displayNotification(notification);

      // Store notification history
      await this.storeNotificationHistory(notification);

      this.analytics.track('notification', 'sent', notification.category, undefined, {
        channel: notification.channelId,
        priority: notification.priority
      });

    } catch (error) {
      console.error('Failed to send notification:', error);
      this.analytics.trackError(error as Error, 'warning', { source: 'send_notification' });
    }
  }

  async sendBatchNotifications(notifications: NotificationPayload[]): Promise<void> {
    for (const notification of notifications) {
      await this.sendNotification(notification);
      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private async displayNotification(notification: NotificationPayload): Promise<void> {
    // This would be implemented with platform-specific APIs
    console.log('Displaying notification:', notification);
  }

  // ========================================
  // Scheduled Notifications
  // ========================================

  async scheduleNotification(notification: ScheduledNotification): Promise<void> {
    if (!this.config.schedulingEnabled) {
      throw new Error('Notification scheduling is disabled');
    }

    this.scheduledNotifications.set(notification.id, notification);
    await this.saveScheduledNotifications();

    // Schedule with platform-specific API
    await this.scheduleWithPlatform(notification);

    this.analytics.track('notification', 'scheduled', notification.category, undefined, {
      trigger_time: notification.triggerAt.getTime(),
      has_repeat: !!notification.repeat
    });
  }

  async cancelScheduledNotification(notificationId: string): Promise<void> {
    this.scheduledNotifications.delete(notificationId);
    await this.saveScheduledNotifications();

    // Cancel with platform-specific API
    await this.cancelWithPlatform(notificationId);

    this.analytics.track('notification', 'cancelled', 'scheduled');
  }

  async getScheduledNotifications(): Promise<ScheduledNotification[]> {
    return Array.from(this.scheduledNotifications.values());
  }

  private async scheduleWithPlatform(notification: ScheduledNotification): Promise<void> {
    // Platform-specific scheduling would go here
    console.log('Scheduling notification for:', notification.triggerAt);
  }

  private async cancelWithPlatform(notificationId: string): Promise<void> {
    // Platform-specific cancellation would go here
    console.log('Cancelling scheduled notification:', notificationId);
  }

  // ========================================
  // Alert System
  // ========================================

  async createPriceAlert(
    symbol: string,
    targetPrice: number,
    direction: 'up' | 'down',
    metadata?: Record<string, any>
  ): Promise<string> {
    const alert: PriceAlert = {
      id: this.generateId(),
      type: 'price',
      severity: 'normal',
      title: `Price Alert - ${symbol}`,
      message: `${symbol} ${direction === 'up' ? 'above' : 'below'} $${targetPrice}`,
      symbol,
      currentPrice: 0, // Would get current price
      targetPrice,
      direction,
      triggerCondition: {
        operator: direction === 'up' ? 'above' : 'below',
        value: targetPrice
      },
      createdAt: new Date(),
      metadata
    };

    this.activeAlerts.set(alert.id, alert);
    await this.saveActiveAlerts();

    this.analytics.track('alert', 'created', 'price_alert', targetPrice, {
      symbol,
      direction,
      target_price: targetPrice
    });

    return alert.id;
  }

  async createPortfolioAlert(
    portfolioId: string,
    metric: 'value' | 'return' | 'risk' | 'drawdown',
    threshold: number,
    operator: 'above' | 'below',
    metadata?: Record<string, any>
  ): Promise<string> {
    const alert: PortfolioAlert = {
      id: this.generateId(),
      type: 'portfolio',
      severity: 'high',
      title: `Portfolio Alert - ${metric}`,
      message: `Portfolio ${metric} ${operator} ${threshold}`,
      portfolioId,
      metric,
      threshold,
      triggerCondition: {
        operator,
        value: threshold
      },
      createdAt: new Date(),
      metadata
    };

    this.activeAlerts.set(alert.id, alert);
    await this.saveActiveAlerts();

    this.analytics.track('alert', 'created', 'portfolio_alert', threshold, {
      portfolio_id: portfolioId,
      metric,
      operator,
      threshold
    });

    return alert.id;
  }

  async removeAlert(alertId: string): Promise<void> {
    this.activeAlerts.delete(alertId);
    await this.saveActiveAlerts();

    this.analytics.track('alert', 'removed', 'manual');
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      await this.saveActiveAlerts();

      this.analytics.track('alert', 'acknowledged', alert.type);
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => !alert.dismissed)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ========================================
  // Alert Monitoring
  // ========================================

  private startAlertMonitoring(): void {
    if (!this.config.alertsEnabled) return;

    // Start monitoring alerts every 30 seconds
    setInterval(() => {
      this.checkAlerts();
    }, 30000);
  }

  private async checkAlerts(): Promise<void> {
    for (const alert of this.activeAlerts.values()) {
      if (alert.triggeredAt || alert.dismissed) continue;

      try {
        const triggered = await this.evaluateAlert(alert);
        if (triggered) {
          await this.triggerAlert(alert);
        }
      } catch (error) {
        console.error('Error checking alert:', alert.id, error);
      }
    }
  }

  private async evaluateAlert(alert: Alert): Promise<boolean> {
    switch (alert.type) {
      case 'price':
        return this.evaluatePriceAlert(alert as PriceAlert);
      case 'portfolio':
        return this.evaluatePortfolioAlert(alert as PortfolioAlert);
      default:
        return false;
    }
  }

  private async evaluatePriceAlert(alert: PriceAlert): Promise<boolean> {
    // This would get current price from market data service
    const currentPrice = 150; // Mock current price
    
    switch (alert.triggerCondition.operator) {
      case 'above':
        return currentPrice > alert.triggerCondition.value;
      case 'below':
        return currentPrice < alert.triggerCondition.value;
      default:
        return false;
    }
  }

  private async evaluatePortfolioAlert(alert: PortfolioAlert): Promise<boolean> {
    // This would get current portfolio metrics
    const currentValue = 100000; // Mock portfolio value
    
    switch (alert.triggerCondition.operator) {
      case 'above':
        return currentValue > alert.triggerCondition.value;
      case 'below':
        return currentValue < alert.triggerCondition.value;
      default:
        return false;
    }
  }

  private async triggerAlert(alert: Alert): Promise<void> {
    alert.triggeredAt = new Date();
    
    // Send notification
    await this.sendNotification({
      id: `alert_${alert.id}`,
      title: alert.title,
      body: alert.message,
      category: 'alert',
      priority: alert.severity === 'critical' ? 'high' : 'normal',
      channelId: alert.type === 'price' ? 'price_alerts' : 'portfolio_alerts',
      data: {
        alertId: alert.id,
        alertType: alert.type
      }
    });

    await this.saveActiveAlerts();

    this.analytics.track('alert', 'triggered', alert.type, undefined, {
      alert_id: alert.id,
      severity: alert.severity,
      time_to_trigger: alert.triggeredAt.getTime() - alert.createdAt.getTime()
    });
  }

  // ========================================
  // Storage Helpers
  // ========================================

  private async saveScheduledNotifications(): Promise<void> {
    const notifications = Array.from(this.scheduledNotifications.values());
    await this.storage.set('notifications:scheduled', notifications);
  }

  private async saveActiveAlerts(): Promise<void> {
    const alerts = Array.from(this.activeAlerts.values());
    await this.storage.set('notifications:alerts', alerts);
  }

  private async storeNotificationHistory(notification: NotificationPayload): Promise<void> {
    const historyKey = `notifications:history:${new Date().toISOString().split('T')[0]}`;
    const todayHistory = await this.storage.get(historyKey);
    
    const history = todayHistory.success ? todayHistory.data : [];
    history.push({
      ...notification,
      sentAt: new Date()
    });

    await this.storage.set(historyKey, history, { ttl: 7 * 24 * 60 * 60 * 1000 }); // 7 days
  }

  // ========================================
  // Utility Methods
  // ========================================

  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ========================================
  // Configuration & Management
  // ========================================

  async updateConfig(config: Partial<NotificationConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.storage.set('notifications:config', this.config);
  }

  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  async getNotificationHistory(days: number = 7): Promise<any[]> {
    const history = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const historyKey = `notifications:history:${date.toISOString().split('T')[0]}`;
      const dayHistory = await this.storage.get(historyKey);
      
      if (dayHistory.success) {
        history.push(...dayHistory.data);
      }
    }

    return history.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }

  async getStatistics(): Promise<any> {
    const history = await this.getNotificationHistory(30);
    const activeAlertsCount = this.getActiveAlerts().length;
    const scheduledCount = this.scheduledNotifications.size;

    return {
      totalSent: history.length,
      averagePerDay: history.length / 30,
      byCategory: this.groupBy(history, 'category'),
      byChannel: this.groupBy(history, 'channelId'),
      activeAlerts: activeAlertsCount,
      scheduledNotifications: scheduledCount,
      permissions: this.permissions
    };
  }

  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((result, item) => {
      const group = item[key] || 'unknown';
      result[group] = (result[group] || 0) + 1;
      return result;
    }, {});
  }

  // ========================================
  // Cleanup
  // ========================================

  async cleanup(): Promise<void> {
    // Remove old notification history
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const keys = await this.storage.getKeys('notifications:history:');
    for (const key of keys) {
      const dateStr = key.split(':')[2];
      const date = new Date(dateStr);
      if (date < cutoffDate) {
        await this.storage.remove(key);
      }
    }

    // Remove triggered alerts older than 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    for (const [id, alert] of this.activeAlerts.entries()) {
      if (alert.triggeredAt && alert.triggeredAt < weekAgo) {
        this.activeAlerts.delete(id);
      }
    }

    await this.saveActiveAlerts();
  }

  dispose(): void {
    // Cleanup any listeners or intervals
  }
}

// ========================================
// Type Definitions
// ========================================

export type NotificationCategory = 
  | 'alert' 
  | 'portfolio' 
  | 'market' 
  | 'system' 
  | 'promotional' 
  | 'educational';

export type NotificationPriority = 
  | 'low' 
  | 'normal' 
  | 'high' 
  | 'critical';

export type AlertType = 
  | 'price' 
  | 'portfolio' 
  | 'market' 
  | 'risk' 
  | 'system';

export type AlertSeverity = 
  | 'info' 
  | 'normal' 
  | 'high' 
  | 'critical';

// ========================================
// Factory Function
// ========================================

export function createNotificationService(config?: Partial<NotificationConfig>): NotificationService {
  return NotificationService.getInstance(config);
}

// ========================================
// Default Export
// ========================================

export default NotificationService;