const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const walletSchema = new Schema({
  name: { type: String, required: true },
  date: { type: Date, default: Date.now },
  budgetElements: [
    { type: mongoose.Types.ObjectId, required: true, ref: 'BudgetElement' },
  ],
  user: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
  sum: { type: Number, required: true },
});

module.exports = mongoose.model('Wallet', walletSchema);
