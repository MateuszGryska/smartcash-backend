const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 8 },
  phoneNumber: { type: Number },
  country: { type: String },
  budgetElements: [
    { type: mongoose.Types.ObjectId, required: true, ref: 'BudgetElement' },
  ],
  categories: [
    { type: mongoose.Types.ObjectId, required: true, ref: 'Category' },
  ],
  wallets: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Wallet' }],
  image: { type: String },
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
