import { io } from 'socket.io-client';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { API_URL } from './api';
import { createTransaction } from './api';

class NotificationHandler {
  private socket: any;

  async initialize() {
    // Request notification permissions
    await this.requestPermissions();

    // Connect to WebSocket
    this.socket = io(API_URL);
    
    this.socket.on('reminderNotifications', (notifications: any[]) => {
      notifications.forEach(notification => {
        this.scheduleNotification(notification);
      });
    });

    // Handle notification response
    Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse);
  }

  private async requestPermissions() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permissions not granted');
    }
  }

  private async scheduleNotification(notification: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.message,
        data: notification.data,
      },
      trigger: {
        hour: parseInt(notification.scheduledTime.split(':')[0]),
        minute: parseInt(notification.scheduledTime.split(':')[1]),
        repeats: false,
      },
    });
  }

  private handleNotificationResponse = async (response: any) => {
    const data = response.notification.request.content.data;
    
    // Show confirmation dialog and handle user choice
    // If user confirms, create transaction
    try {
      await createTransaction({
        title: data.title,
        type: data.type,
        amount: data.amount,
        category: data.category,
        cashReserveId: data.cashReserveId,
        date: new Date(),
      });
    } catch (error) {
      console.error('Error creating transaction from reminder:', error);
    }
  }
}

export const notificationHandler = new NotificationHandler();
