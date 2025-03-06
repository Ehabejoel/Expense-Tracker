import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { handleReminderAction } from './api';
import { showSuccessToast, showErrorToast } from './toast';
import { socketService } from './socket';

class NotificationHandler {
  initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    console.log('Initializing notification handler...');
    
    // Configure notifications
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    
    // Wait for socket connection and setup listeners
    await this.setupSocketListeners();
    
    this.initialized = true;
    console.log('Notification handler initialized');
  }
  
  private async setupSocketListeners() {
    console.log('Setting up socket listeners...');
    try {
      const socket = await socketService.getSocket();
      
      if (!socket) {
        throw new Error('Failed to get socket connection');
      }
      
      socket.on('reminderNotifications', (notifications: any[]) => {
        console.log('Received reminder notifications:', notifications);
        notifications.forEach(notification => {
          this.showReminderAlert(notification);
        });
      });
      
      console.log('Socket listeners setup complete');
      return true;
    } catch (error) {
      console.error('Error setting up socket listeners:', error);
      // Retry setup after a delay
      setTimeout(() => this.setupSocketListeners(), 5000);
      return false;
    }
  }

  showReminderAlert(notification: any) {
    Alert.alert(
      notification.title,
      notification.message,
      [
        {
          text: 'Create Transaction',
          onPress: () => this.handleReminderAction(notification.data.reminderId, 'create')
        },
        {
          text: 'Remind Later',
          onPress: () => this.handleReminderAction(notification.data.reminderId, 'postpone')
        },
        {
          text: 'Dismiss',
          style: 'cancel'
        }
      ]
    );
  }
  
  async handleReminderAction(reminderId: string, action: 'create' | 'postpone') {
    try {
      await handleReminderAction(reminderId, action);
      if (action === 'create') {
        showSuccessToast('Success', 'Transaction created successfully');
      } else {
        showSuccessToast('Success', 'Reminder postponed by 1 hour');
      }
    } catch (error) {
      showErrorToast('Error', 'Failed to handle reminder action');
    }
  }
}

export const notificationHandler = new NotificationHandler();
