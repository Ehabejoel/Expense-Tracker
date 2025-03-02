const express = require('express');
const router = express.Router();
const { protectRoute } = require('../middleware/authMiddleware');
const Transaction = require('../models/transaction');
const CashReserve = require('../models/cashReserve');
const mongoose = require('mongoose');

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
    const { type, amount, cashReserveId, targetReserveId } = req.body;
    console.log('Received transaction data:', req.body);

    // Validate the amount
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    // Update cash reserve balances
    const sourceReserve = await CashReserve.findById(cashReserveId);
    if (!sourceReserve) {
      throw new Error('Source reserve not found');
    }

    // Validate that the source reserve belongs to the user
    if (sourceReserve.userId.toString() !== req.user._id.toString()) {
      throw new Error('Unauthorized access to cash reserve');
    }

    if (type === 'expense') {
      if (sourceReserve.balance < amount) {
        throw new Error('Insufficient funds');
      }
      sourceReserve.balance -= amount;
      await sourceReserve.save();
    } else if (type === 'income') {
      sourceReserve.balance += amount;
      await sourceReserve.save();
    } else if (type === 'transfer') {
      const targetReserve = await CashReserve.findById(targetReserveId);
      if (!targetReserve) {
        throw new Error('Target reserve not found');
      }
      
      // Validate that the target reserve belongs to the user
      if (targetReserve.userId.toString() !== req.user._id.toString()) {
        throw new Error('Unauthorized access to target reserve');
      }

      if (sourceReserve.balance < amount) {
        throw new Error('Insufficient funds for transfer');
      }
      
      sourceReserve.balance -= amount;
      targetReserve.balance += amount;
      
      await sourceReserve.save();
      await targetReserve.save();
    }

    // Create and save the transaction
    const transaction = new Transaction({
      ...req.body,
      userId: req.user._id
    });
    await transaction.save();

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('cashReserveId', 'name currency')
      .populate('targetReserveId', 'name currency');

    console.log('Transaction created successfully:', populatedTransaction);
    res.status(201).json(populatedTransaction);
  } catch (error) {
    console.error('Transaction creation error:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
