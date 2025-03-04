const express = require('express');
const router = express.Router();
const { protectRoute } = require('../middleware/authMiddleware');
const { Reminder, Transaction } = require('../models');
const CashReserve = require('../models/cashReserve');

// Get all reminders for a user
router.get('/', protectRoute, async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.user._id })
      .populate('cashReserveId', 'name currency');
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new reminder
router.post('/', protectRoute, async (req, res) => {
  try {
    const reminder = new Reminder({
      ...req.body,
      userId: req.user._id,
      isActive: true
    });
    
    await reminder.save();
    
    const populatedReminder = await Reminder.findById(reminder._id)
      .populate('cashReserveId', 'name currency');
      
    res.status(201).json(populatedReminder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Handle reminder action (create transaction or postpone)
router.post('/:id/action', protectRoute, async (req, res) => {
  try {
    const { action } = req.body;
    const reminder = await Reminder.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    }).populate('cashReserveId');
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    if (action === 'create') {
      console.log('Creating transaction from reminder:', reminder.title);
      
      // Create transaction
      const transaction = new Transaction({
        title: reminder.title,
        type: reminder.type,
        amount: reminder.amount,
        category: reminder.category,
        cashReserveId: reminder.cashReserveId._id,
        date: new Date(),
        notes: reminder.notes,
        userId: req.user._id,
      });
      
      // Save the transaction
      const savedTransaction = await transaction.save();
      
      // Update cash reserve balance directly
      const cashReserve = await CashReserve.findById(reminder.cashReserveId._id);
      
      if (reminder.type === 'income') {
        cashReserve.balance += reminder.amount;
      } else if (reminder.type === 'expense') {
        cashReserve.balance -= reminder.amount;
      }
      
      await cashReserve.save();
      
      console.log('Transaction created and cash reserve updated');
      res.json({ message: 'Transaction created', transaction: savedTransaction });
    } else if (action === 'postpone') {
      // Postpone reminder for next cycle
      res.json({ message: 'Reminder postponed' });
    } else {
      res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Reminder action error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update reminder
router.put('/:id', protectRoute, async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    ).populate('cashReserveId', 'name currency');
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    res.json(reminder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete reminder
router.delete('/:id', protectRoute, async (req, res) => {
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
});

module.exports = router;
