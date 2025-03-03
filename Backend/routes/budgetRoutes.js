const express = require('express');
const router = express.Router();
const { protectRoute } = require('../middleware/authMiddleware');
const Budget = require('../models/budget');
const Transaction = require('../models/transaction');
const { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } = require('date-fns');

// Get all budgets for a user
router.get('/', protectRoute, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user._id })
      .populate('cashReserveId', 'name currency');
    
    // Calculate spent amounts for each budget
    const updatedBudgets = await Promise.all(budgets.map(async (budget) => {
      const spent = await calculateSpentAmount(budget);
      budget.spent = spent;
      await budget.save();
      return budget;
    }));

    res.json(updatedBudgets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new budget
router.post('/', protectRoute, async (req, res) => {
  try {
    const budget = new Budget({
      ...req.body,
      userId: req.user._id,
      spent: 0
    });

    const newBudget = await budget.save();
    const populatedBudget = await Budget.findById(newBudget._id)
      .populate('cashReserveId', 'name currency');

    res.status(201).json(populatedBudget);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a budget
router.put('/:id', protectRoute, async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, userId: req.user._id });
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    Object.assign(budget, req.body);
    const updatedBudget = await budget.save();
    const populatedBudget = await Budget.findById(updatedBudget._id)
      .populate('cashReserveId', 'name currency');

    res.json(populatedBudget);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a budget
router.delete('/:id', protectRoute, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json({ message: 'Budget deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to calculate spent amount for a budget
async function calculateSpentAmount(budget) {
  let startDate, endDate;
  const now = new Date();

  switch (budget.cycle) {
    case 'daily':
      startDate = startOfDay(now);
      endDate = endOfDay(now);
      break;
    case 'weekly':
      startDate = startOfWeek(now);
      endDate = endOfWeek(now);
      break;
    case 'monthly':
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
  }

  const transactions = await Transaction.find({
    userId: budget.userId,
    cashReserveId: budget.cashReserveId,
    category: budget.category,
    type: 'expense',
    date: { $gte: startDate, $lte: endDate }
  });

  return transactions.reduce((total, transaction) => total + transaction.amount, 0);
}

module.exports = router;
