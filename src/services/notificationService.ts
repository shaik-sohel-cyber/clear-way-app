import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

class NotificationService {
  private isInitialized = false;
  private notificationId = 1;

  async initialize(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Local notifications not available on web');
      return false;
    }

    try {
      // Request permission
      const permission = await LocalNotifications.requestPermissions();
      
      if (permission.display === 'granted') {
        this.isInitialized = true;
        
        // Set up notification channel for Android
        await LocalNotifications.createChannel({
          id: 'obstacle_alerts',
          name: 'Obstacle Alerts',
          description: 'Warnings about obstacles in your path',
          importance: 5, // Max importance
          visibility: 1, // Public
          vibration: true,
          sound: 'default',
        });
        
        console.log('Notification service initialized');
        return true;
      }
      
      console.warn('Notification permission denied');
      return false;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  async sendObstacleAlert(message: string, level: 'low' | 'medium' | 'high'): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const options: ScheduleOptions = {
        notifications: [
          {
            id: this.notificationId++,
            title: level === 'high' ? '⚠️ DANGER AHEAD' : level === 'medium' ? '⚡ Caution' : '✓ Path Status',
            body: message,
            channelId: 'obstacle_alerts',
            schedule: { at: new Date(Date.now() + 100) }, // Immediate
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            largeIcon: 'ic_launcher',
            actionTypeId: 'OBSTACLE_ALERT',
            extra: { level, timestamp: Date.now() },
          },
        ],
      };

      await LocalNotifications.schedule(options);
      console.log('Obstacle notification sent:', level);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  async clearAll(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel(pending);
        }
      } catch (error) {
        console.error('Failed to clear notifications:', error);
      }
    }
  }
}

export const notificationService = new NotificationService();
