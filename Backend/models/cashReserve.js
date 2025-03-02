const mongoose = require('mongoose');

const cashReserveSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['cash', 'momo', 'bank'],
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('CashReserve', cashReserveSchema);
