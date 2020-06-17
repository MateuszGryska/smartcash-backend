const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const BudgetElement = require('../models/budget-element');

let DUMMY_BUDGET_ELEMENT = [
  {
    id: 'b1',
    name: 'Pomidory',
    amount: 2000,
    date: '18.11.2012',
    wallet: '001',
    category: 'c02',
    user: 'u1',
  },
];

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
    throw new HttpError('Invalid input passed, please check your data', 422);
  }

  const { name, amount, wallet, category, user } = req.body;
  const createdBudgetElement = new BudgetElement({
    name,
    amount,
    wallet,
    category,
    user,
  });

  try {
    await createdBudgetElement.save();
  } catch (err) {
    const error = new HttpError(
      'Creating budget element failed, please try again.',
      500
    );
    return next(error);
  }

  res.status(201).json({ budgetElement: createdBudgetElement });
};

const updateBudgetElement = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError('Invalid input passed, please check your data', 422);
  }

  const { name, amount, wallet, category } = req.body;
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
    .json({ budgetElement: budgetElement.toObject({ getters: true }) });
};

const deleteBudgetElement = async (req, res, next) => {
  const budgetElementId = req.params.bid;

  let budgetElement;
  try {
    budgetElement = await BudgetElement.findById(budgetElementId);
    budgetElement.remove();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, please try delete element again.',
      500
    );
    return next(error);
  }

  res.status(200).json({ message: 'Deleted budget element!' });
};

exports.getBudgetElementById = getBudgetElementById;
exports.getBudgetElementsByUserId = getBudgetElementsByUserId;
exports.createBudgetElement = createBudgetElement;
exports.updateBudgetElement = updateBudgetElement;
exports.deleteBudgetElement = deleteBudgetElement;
