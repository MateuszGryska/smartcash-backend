const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const budgetElementSchema = new Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  type: { type: String, required: true },
  wallet: { type: mongoose.Types.ObjectId, required: true, ref: 'Wallet' },
  category: { type: mongoose.Types.ObjectId, required: true, ref: 'Category' },
  user: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
});

module.exports = mongoose.model('BudgetElement', budgetElementSchema);
