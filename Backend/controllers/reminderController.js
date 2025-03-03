const { Reminder, Transaction } = require('../models');
const { startOfDay, addDays, addWeeks, addMonths, addYears, format } = require('date-fns');

// Create a new reminder
exports.createReminder = async (req, res) => {
  try {
    const date = new Date(`${format(new Date(req.body.date), 'yyyy-MM-dd')}T${req.body.time}:00`);
    
    console.log('Creating reminder:', {
      title: req.body.title,
      date: format(date, 'yyyy-MM-dd'),
      time: req.body.time,
      cycle: req.body.cycle
    });

    const reminderData = {
      ...req.body,
      userId: req.user._id,
      isActive: true,
      lastTriggered: null,
      date
    };
    
    const reminder = await Reminder.create(reminderData);
    
    console.log('Reminder created:', {
      id: reminder._id,
      date: format(reminder.date, 'yyyy-MM-dd HH:mm:ss'),
      time: reminder.time,
      isActive: reminder.isActive
    });
    
    res.status(201).json(reminder);
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get all reminders for the current user
exports.getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.user._id })
      .populate('cashReserveId', 'name currency');
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a reminder
exports.updateReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    res.json(reminder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a reminder
exports.deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    res.json({ message: 'Reminder deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Handle reminder action (create transaction or postpone)
exports.handleReminderAction = async (req, res) => {
  try {
    const { action } = req.body; // 'create' or 'postpone'
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    if (action === 'create') {
      // Create the transaction
      const transaction = new Transaction({
        title: reminder.title,
        type: reminder.type,
        amount: reminder.amount,
        category: reminder.category,
        cashReserveId: reminder.cashReserveId,
        date: new Date(),
        notes: reminder.notes,
        userId: req.user._id,
      });
      await transaction.save();

      // Update reminder's last triggered date and next trigger date
      reminder.lastTriggered = new Date();
      let nextTriggerDate = new Date(reminder.date);
      
      switch (reminder.cycle) {
        case 'daily':
          nextTriggerDate = addDays(nextTriggerDate, 1);
          break;
        case 'weekly':
          nextTriggerDate = addWeeks(nextTriggerDate, 1);
          break;
        case 'monthly':
          nextTriggerDate = addMonths(nextTriggerDate, 1);
          break;
        case 'yearly':
          nextTriggerDate = addYears(nextTriggerDate, 1);
          break;
      }
      
      reminder.date = nextTriggerDate;
      await reminder.save();

      res.json({ message: 'Transaction created', transaction });
    } else if (action === 'postpone') {
      // Postpone for 1 hour
      reminder.date = new Date(Date.now() + 60 * 60 * 1000);
      await reminder.save();
      res.json({ message: 'Reminder postponed' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
