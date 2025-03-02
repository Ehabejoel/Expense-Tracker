const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['expense', 'income', 'transfer'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  cashReserveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CashReserve',
    required: true
  },
  targetReserveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CashReserve',
    // Only required for transfers
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
