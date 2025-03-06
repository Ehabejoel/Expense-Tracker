const { Reminder } = require('../models');
const { isAfter, isBefore, addMinutes, parseISO, format } = require('date-fns');

class NotificationService {
  static triggeredReminders = new Map(); // Cache for tracking recently triggered reminders

  static async markReminderAsTriggered(reminderId) {
    try {
      const currentDate = format(new Date(), 'yyyy-MM-dd');
      await Reminder.findByIdAndUpdate(reminderId, {
        lastTriggered: currentDate
      });
      // Add to memory cache with timestamp
      this.triggeredReminders.set(reminderId.toString(), Date.now());
    } catch (error) {
      console.error('Error marking reminder as triggered:', error);
    }
  }

  static async checkReminders() {
    try {
      const currentTime = new Date();
      const fiveMinutesFromNow = addMinutes(currentTime, 5);
      const currentTimeStr = format(currentTime, 'HH:mm');
      const currentDateStr = format(currentTime, 'yyyy-MM-dd');
      
      // Clean up old entries from triggeredReminders (older than 5 minutes)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      for (const [id, timestamp] of this.triggeredReminders.entries()) {
        if (timestamp < fiveMinutesAgo) {
          this.triggeredReminders.delete(id);
        }
      }

      console.log('Checking reminders window:', {
        from: currentTimeStr,
        to: format(fiveMinutesFromNow, 'HH:mm')
      });

      const query = {
        isActive: true,
        $or: [
          { lastTriggered: { $exists: false } },
          { lastTriggered: { $ne: currentDateStr } }
        ],
        $expr: {
          $and: [
            { $eq: [{ $dayOfMonth: '$date' }, { $dayOfMonth: currentTime }] },
            { $eq: [{ $month: '$date' }, { $month: currentTime }] },
            {
              $and: [
                { $gte: ['$time', currentTimeStr] },
                { $lte: ['$time', format(fiveMinutesFromNow, 'HH:mm')] }
              ]
            }
          ]
        }
      };

      const remindersToTrigger = await Reminder.find(query).populate('cashReserveId', 'name currency');

      // Filter reminders that should be triggered now and haven't been recently triggered
      const readyReminders = remindersToTrigger.filter(reminder => {
        // Skip if recently triggered (in memory cache)
        if (this.triggeredReminders.has(reminder._id.toString())) {
          return false;
        }

        const [reminderHours, reminderMinutes] = reminder.time.split(':').map(Number);
        const reminderDate = new Date(currentTime);
        reminderDate.setHours(reminderHours, reminderMinutes, 0);
        return !isBefore(currentTime, reminderDate);
      });

      if (readyReminders.length > 0) {
        console.log('Found reminders ready to trigger:', readyReminders.map(r => ({
          title: r.title,
          time: r.time
        })));
      }
      
      return readyReminders.map(reminder => ({
        id: reminder._id,
        title: reminder.title,
        message: `${reminder.type === 'expense' ? 'Payment' : 'Income'} of ${reminder.amount} ${reminder.cashReserveId.currency} for ${reminder.title} is due`,
        scheduledTime: reminder.time,
        data: {
          reminderId: reminder._id,
          type: reminder.type,
          amount: reminder.amount,
          category: reminder.category,
          cashReserveId: reminder.cashReserveId._id
        }
      }));
    } catch (error) {
      console.error('Error in checkReminders:', error);
      return [];
    }
  }
}

module.exports = NotificationService;
