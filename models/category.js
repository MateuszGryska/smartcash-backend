const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const categorySchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  date: { type: Date, default: Date.now },
  budgetElements: [
    { type: mongoose.Types.ObjectId, required: true, ref: 'BudgetElement' },
  ],
  user: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
  sum: { type: Number, required: true },
});

module.exports = mongoose.model('Category', categorySchema);
