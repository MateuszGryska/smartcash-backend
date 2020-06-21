const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const categorySchema = new Schema({
  name: { type: String, required: true },
  budgetElements: [
    { type: mongoose.Types.ObjectId, required: true, ref: 'BudgetElement' },
  ],
  user: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
  sum: { type: Number },
});

module.exports = mongoose.model('Category', categorySchema);
