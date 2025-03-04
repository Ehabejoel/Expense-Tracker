const express = require('express');
const router = express.Router();
const { protectRoute } = require('../middleware/authMiddleware');
const { Transaction } = require('../models');
const CashReserve = require('../models/cashReserve');

// Helper function to update cash reserve balances
async function updateCashReserveBalances(transaction, isDelete = false) {
  const multiplier = isDelete ? -1 : 1;

  // Get the cash reserves
  const sourceReserve = await CashReserve.findById(transaction.cashReserveId);
  if (!sourceReserve) {
    throw new Error('Source cash reserve not found');
  }
  
  // Calculate new balance based on transaction type
  switch (transaction.type) {
    case 'expense':
      // For expense, decrease the cash reserve balance
      sourceReserve.balance -= multiplier * transaction.amount;
      await sourceReserve.save();
      break;
      
    case 'income':
      // For income, increase the cash reserve balance
      sourceReserve.balance += multiplier * transaction.amount;
      await sourceReserve.save();
      break;
      
    case 'transfer':
      // For transfer, decrease source and increase target
      if (!transaction.targetReserveId) {
        throw new Error('Target cash reserve is required for transfer transactions');
      }
      
      const targetReserve = await CashReserve.findById(transaction.targetReserveId);
      if (!targetReserve) {
        throw new Error('Target cash reserve not found');
      }
      
      sourceReserve.balance -= multiplier * transaction.amount;
      targetReserve.balance += multiplier * transaction.amount;
      
      await sourceReserve.save();
      await targetReserve.save();
      break;
      
    default:
      throw new Error('Invalid transaction type');
  }
}

// Helper function to revert cash reserve balance update
async function revertCashReserveBalances(transaction) {
  // This effectively does the opposite of the normal update
  return updateCashReserveBalances(transaction, true);
}

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
    
    // Update cash reserve balances after creating transaction
    await updateCashReserveBalances(transaction);
    
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
    // First, get the original transaction
    const originalTransaction = await Transaction.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!originalTransaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Revert the effect of the original transaction
    await revertCashReserveBalances(originalTransaction);
    
    // Update the transaction
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    ).populate('cashReserveId', 'name currency')
     .populate('targetReserveId', 'name currency');
    
    // Apply the new transaction effect
    await updateCashReserveBalances(transaction);
    
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete transaction
router.delete('/:id', protectRoute, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Revert the effect of the transaction before deleting
    await revertCashReserveBalances(transaction);
    
    // Delete the transaction
    await Transaction.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
