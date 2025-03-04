const { Transaction } = require('../models');
const CashReserve = require('../models/cashReserve');

exports.createTransaction = async (req, res) => {
  try {
    console.log('\n=== Transaction Creation Start ===');
    console.log('Request data:', req.body);

    // Get initial balance
    const initialReserve = await CashReserve.findById(req.body.cashReserveId);
    if (!initialReserve) {
      throw new Error('Cash reserve not found');
    }
    
    console.log('Initial reserve balance:', {
      reserveId: initialReserve._id,
      balance: initialReserve.balance
    });

    // Create a new transaction
    const transaction = new Transaction({
      ...req.body,
      userId: req.user._id,
    });

    // Save the transaction without using a session
    const savedTransaction = await transaction.save();
    console.log('Transaction saved:', {
      id: savedTransaction._id,
      type: savedTransaction.type,
      amount: savedTransaction.amount
    });

    // Update cash reserve balance directly without transactions
    if (transaction.type === 'transfer') {
      // Handle transfer between reserves
      const sourceReserve = await CashReserve.findById(transaction.cashReserveId);
      const targetReserve = await CashReserve.findById(transaction.targetReserveId);
      
      if (!targetReserve) {
        throw new Error('Target cash reserve not found');
      }
      
      // Update source reserve
      sourceReserve.balance -= transaction.amount;
      await sourceReserve.save();
      
      // Update target reserve
      targetReserve.balance += transaction.amount;
      await targetReserve.save();

      console.log('Transfer balances updated:', {
        sourceReserve: { id: sourceReserve._id, balance: sourceReserve.balance },
        targetReserve: { id: targetReserve._id, balance: targetReserve.balance }
      });
    } else {
      // Handle income or expense
      const modifier = transaction.type === 'income' ? 1 : -1;
      const finalAmount = modifier * transaction.amount;
      
      console.log('Updating reserve balance:', {
        reserveId: transaction.cashReserveId,
        currentBalance: initialReserve.balance,
        modification: finalAmount,
        expectedNewBalance: initialReserve.balance + finalAmount
      });

      initialReserve.balance += finalAmount;
      await initialReserve.save();

      console.log('Reserve balance updated:', {
        reserveId: initialReserve._id,
        oldBalance: initialReserve.balance - finalAmount,
        newBalance: initialReserve.balance,
        difference: finalAmount
      });
    }

    console.log('Transaction completed successfully');
    
    // Populate and return the response
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('cashReserveId', 'name currency balance')
      .populate('targetReserveId', 'name currency balance');

    console.log('=== Transaction Creation Complete ===\n');
    res.status(201).json(populatedTransaction);
  } catch (error) {
    console.error('Transaction creation failed:', error);
    res.status(400).json({ message: error.message });
  }
};

// ...rest of existing code...
