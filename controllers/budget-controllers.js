const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const BudgetElement = require('../models/budget-element');
const User = require('../models/user');
const Category = require('../models/category');
const Wallet = require('../models/wallet');

const getBudgetElementById = async (req, res, next) => {
  const budgetElementId = req.params.bid;

  let budgetElement;
  try {
    budgetElement = await BudgetElement.findById(budgetElementId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find a budget element.',
      500
    );
    return next(error);
  }

  if (!budgetElement) {
    const error = new HttpError(
      'Could not find a budget element for the provided id.',
      404
    );
    return next(error);
  }

  res.json({ budgetElement: budgetElement.toObject({ getters: true }) });
};

const getBudgetElementsByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let budgetElements;
  try {
    budgetElements = await BudgetElement.find({ user: userId });
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find a budget elements by user ID.',
      500
    );
    return next(error);
  }

  if (!budgetElements || budgetElements.length === 0) {
    return next(
      new HttpError(
        'Could not find a budget element for the provided user id.',
        404
      )
    );
  }

  res.json({
    budgetElements: budgetElements.map((budgetElement) =>
      budgetElement.toObject({ getters: true })
    ),
  });
};

const createBudgetElement = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid input passed, please check your data', 422)
    );
  }

  const { name, amount, wallet, category, user, type } = req.body;
  const createdBudgetElement = new BudgetElement({
    name,
    amount,
    type,
    wallet,
    category,
    user,
  });

  let userId;
  let categoryId;
  let walletId;
  try {
    userId = await User.findById(user);
    categoryId = await Category.findById(category);
    walletId = await Wallet.findById(wallet);
  } catch (err) {
    return next(
      new HttpError('Creating budget element failed, please try again.', 500)
    );
  }

  if (!userId) {
    return next(new HttpError('Could not find user for provided id.', 404));
  }
  if (!categoryId) {
    return next(new HttpError('Could not find category for provided id.', 404));
  }
  if (!walletId) {
    return next(new HttpError('Could not find wallet for provided id.', 404));
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await createdBudgetElement.save({ session: session });
    userId.budgetElements.push(createdBudgetElement);
    await userId.save({ session: session });
    categoryId.budgetElements.push(createdBudgetElement);
    await categoryId.save({ session: session });
    walletId.budgetElements.push(createdBudgetElement);
    await walletId.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    return next(
      new HttpError(
        'Creating new budget element failedd, please try again.',
        500
      )
    );
  }

  res.status(201).json({ budgetElements: createdBudgetElement });
};

const updateBudgetElement = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError('Invalid input passed, please check your data', 422);
  }

  const { name, amount, type, wallet, category } = req.body;
  const budgetElementId = req.params.bid;

  let budgetElement;
  try {
    budgetElement = await BudgetElement.findById(budgetElementId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, please try update again.',
      500
    );
    return next(error);
  }

  budgetElement.name = name;
  budgetElement.amount = amount;
  budgetElement.wallet = wallet;
  budgetElement.category = category;
  budgetElement.type = type;

  try {
    await budgetElement.save();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, please try update again.',
      500
    );
    return next(error);
  }

  res
    .status(200)
    .json({ budgetElements: budgetElement.toObject({ getters: true }) });
};

const deleteBudgetElement = async (req, res, next) => {
  const budgetElementId = req.params.bid;

  let budgetElement;
  try {
    budgetElement = await BudgetElement.findById(budgetElementId)
      .populate('user')
      .populate('category')
      .populate('wallet');
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, please try delete element again.',
      500
    );
    return next(error);
  }

  if (!budgetElement) {
    return next(
      new HttpError('Something went wrong, could not delete budget element!')
    );
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await budgetElement.remove({ session: session });
    budgetElement.user.budgetElements.pull(budgetElement);
    await budgetElement.user.save({ session: session });
    budgetElement.category.budgetElements.pull(budgetElement);
    await budgetElement.category.save({ session: session });
    budgetElement.wallet.budgetElements.pull(budgetElement);
    await budgetElement.wallet.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    return next(
      new HttpError(
        `'Something went wrong, pleasee try delete element again.' ${err}`,
        500
      )
    );
  }

  res.status(200).json({ message: 'Deleted budget element!' });
};

exports.getBudgetElementById = getBudgetElementById;
exports.getBudgetElementsByUserId = getBudgetElementsByUserId;
exports.createBudgetElement = createBudgetElement;
exports.updateBudgetElement = updateBudgetElement;
exports.deleteBudgetElement = deleteBudgetElement;
