const cron = require('node-cron');
const { format } = require('date-fns');
const NotificationService = require('./notificationService');
const { Server } = require('socket.io');

class JobService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: true,
        credentials: true
      },
      path: '/socket.io'
    });

    // Create a namespace for reminders
    this.reminderNamespace = this.io.of('/reminders');
    
    console.log('Socket.IO namespace created: /reminders');

    // Initialize WebSocket connection with namespace
    this.reminderNamespace.on('connection', (socket) => {
      console.log('Client connected to reminder notifications namespace:', socket.id);
      
      socket.on('disconnect', () => {
        console.log('Client disconnected from reminder notifications namespace:', socket.id);
      });
    });

    // Run every 30 seconds instead of every minute
    cron.schedule('*/30 * * * * *', async () => {
      try {
        console.log('\n--- Reminder Check ---');
        console.log('Time:', format(new Date(), 'HH:mm:ss'));
        
        const notifications = await NotificationService.checkReminders();
        
        const connectedClients = this.io.sockets.sockets.size;
        console.log('Connected clients:', connectedClients);
        
        if (notifications.length > 0) {
          console.log('Sending notifications:', notifications.map(n => ({
            title: n.title,
            scheduledTime: n.scheduledTime
          })));
          
          // Use the namespace to emit notifications
          this.reminderNamespace.emit('reminderNotifications', notifications);
          console.log('Notifications emitted to clients');
        } else {
          console.log('No notifications to send');
        }
        
        console.log('------------------------\n');
      } catch (error) {
        console.error('Error in reminder check job:', error);
      }
    });
  }
}

module.exports = JobService;
