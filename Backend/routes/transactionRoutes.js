const express = require('express');
const router = express.Router();
const { protectRoute } = require('../middleware/authMiddleware');
const { Transaction } = require('../models');

// Get all transactions for a user
router.get('/', protectRoute, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .populate('cashReserveId', 'name currency')
      .populate('targetReserveId', 'name currency')
      .sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new transaction
router.post('/', protectRoute, async (req, res) => {
  try {
    const transaction = new Transaction({
      ...req.body,
      userId: req.user._id,
    });
    await transaction.save();
    
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('cashReserveId', 'name currency')
      .populate('targetReserveId', 'name currency');
      
    res.status(201).json(populatedTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update transaction
router.put('/:id', protectRoute, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    ).populate('cashReserveId', 'name currency')
     .populate('targetReserveId', 'name currency');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete transaction
router.delete('/:id', protectRoute, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
