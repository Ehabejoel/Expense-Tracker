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
      }
    });

    // Initialize WebSocket connection
    this.io.on('connection', (socket) => {
      console.log('Client connected to reminder notifications');
      
      socket.on('disconnect', () => {
        console.log('Client disconnected from reminder notifications');
      });
    });

    cron.schedule('*/30 * * * * *', async () => {
      try {
        console.log('\n--- Reminder Check ---');
        const notifications = await NotificationService.checkReminders();
        
        if (notifications.length > 0) {
          console.log('Sending notifications:', notifications.map(n => ({
            title: n.title,
            scheduledTime: n.scheduledTime
          })));
          this.io.emit('reminderNotifications', notifications);
        }
        
        console.log('------------------------\n');
      } catch (error) {
        console.error('Error in reminder check job:', error);
      }
    });
  }
}

module.exports = JobService;
