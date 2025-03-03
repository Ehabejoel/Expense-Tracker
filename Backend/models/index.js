const mongoose = require('mongoose');

// Define all schemas
const transactionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['expense', 'income', 'transfer'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  cashReserveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CashReserve',
    required: true,
  },
  targetReserveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CashReserve',
  },
  date: {
    type: Date,
    required: true,
  },
  notes: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

const reminderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['expense', 'income'],
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  cashReserveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CashReserve',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  cycle: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true,
  },
  notes: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastTriggered: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

const budgetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  spent: {
    type: Number,
    default: 0,
  },
  cycle: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true,
  },
  cashReserveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CashReserve',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Create models only if they haven't been compiled yet
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
const Reminder = mongoose.models.Reminder || mongoose.model('Reminder', reminderSchema);
const Budget = mongoose.models.Budget || mongoose.model('Budget', budgetSchema);

module.exports = {
  Transaction,
  Reminder,
  Budget
};
