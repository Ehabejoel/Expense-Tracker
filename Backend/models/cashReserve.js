const mongoose = require('mongoose');

const cashReserveSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  currency: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
  },
  color: String,
  icon: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Add middleware to log balance changes
cashReserveSchema.pre('save', function(next) {
  if (this.isModified('balance')) {
    console.log('Cash Reserve balance changing:', {
      id: this._id,
      oldBalance: this._original ? this._original.balance : undefined,
      newBalance: this.balance
    });
  }
  next();
});

cashReserveSchema.pre('findOneAndUpdate', function(next) {
  console.log('Cash Reserve update operation:', {
    filter: this.getFilter(),
    update: this.getUpdate()
  });
  next();
});

module.exports = mongoose.models.CashReserve || mongoose.model('CashReserve', cashReserveSchema);
