const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const budgetElementSchema = new Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  wallet: { type: String, required: true },
  category: { type: String, required: true },
  user: { type: String, required: true },
});

module.exports = mongoose.model('BudgetElement', budgetElementSchema);
