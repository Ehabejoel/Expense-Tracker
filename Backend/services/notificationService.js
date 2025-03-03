const { Reminder } = require('../models');
const { isAfter, isBefore, addMinutes, parseISO, format } = require('date-fns');

class NotificationService {
  static async checkReminders() {
    try {
      const currentTime = new Date();
      const fiveMinutesFromNow = addMinutes(currentTime, 5);
      
      console.log('Checking reminders window:', {
        from: format(currentTime, 'HH:mm'),
        to: format(fiveMinutesFromNow, 'HH:mm')
      });

      const query = {
        isActive: true,
        lastTriggered: { $ne: format(currentTime, 'yyyy-MM-dd') },
        $expr: {
          $and: [
            { $eq: [{ $dayOfMonth: '$date' }, { $dayOfMonth: currentTime }] },
            { $eq: [{ $month: '$date' }, { $month: currentTime }] },
            {
              $and: [
                { $gte: ['$time', format(currentTime, 'HH:mm')] },
                { $lte: ['$time', format(fiveMinutesFromNow, 'HH:mm')] }
              ]
            }
          ]
        }
      };

      const remindersToTrigger = await Reminder.find(query).populate('cashReserveId', 'name currency');

      if (remindersToTrigger.length > 0) {
        console.log('Found reminders:', remindersToTrigger.map(r => ({
          title: r.title,
          time: r.time
        })));
      }
      
      return remindersToTrigger.map(reminder => ({
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
