const uuid = require('uuid');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');

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

const getBudgetElementById = (req, res, next) => {
  const budgetElementId = req.params.bid;
  const budgetElement = DUMMY_BUDGET_ELEMENT.find(({ id }) => {
    return id === budgetElementId;
  });

  if (!budgetElement) {
    throw new HttpError(
      'Could not find a budget element for the provided id.',
      404
    );
  }

  res.json({ budgetElement });
};

const getBudgetElementsByUserId = (req, res, next) => {
  const userId = req.params.uid;
  const budgetElements = DUMMY_BUDGET_ELEMENT.filter(({ user }) => {
    return user === userId;
  });

  if (!budgetElements || budgetElements.length === 0) {
    return next(
      new HttpError(
        'Could not find a budget element for the provided user id.',
        404
      )
    );
  }

  res.json({ budgetElements });
};

const createBudgetElement = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError('Invalid input passed, please check your data', 422);
  }

  const { name, amount, wallet, category, user } = req.body;
  const createdBudgetElement = {
    id: uuid.v4(),
    name,
    amount,
    wallet,
    category,
    user,
  };

  DUMMY_BUDGET_ELEMENT.push(createdBudgetElement);

  res.status(201).json({ budgetElement: createdBudgetElement });
};

const updateBudgetElement = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError('Invalid input passed, please check your data', 422);
  }

  const { name, amount, wallet, category } = req.body;
  const budgetElementId = req.params.bid;
  const updatedBudgetElement = {
    ...DUMMY_BUDGET_ELEMENT.find(({ id }) => id === budgetElementId),
  };
  const budgetElementIndex = DUMMY_BUDGET_ELEMENT.findIndex(
    ({ id }) => id === budgetElementId
  );
  updatedBudgetElement.name = name;
  updatedBudgetElement.amount = amount;
  updatedBudgetElement.wallet = wallet;
  updatedBudgetElement.category = category;

  DUMMY_BUDGET_ELEMENT[budgetElementIndex] = updatedBudgetElement;

  res.status(200).json({ budgetElement: updatedBudgetElement });
};

const deleteBudgetElement = (req, res, next) => {
  const budgetElementId = req.params.bid;
  if (!DUMMY_BUDGET_ELEMENT.find(({ id }) => id === budgetElementId)) {
    throw new HttpError('Could not find a place for that id.', 404);
  }

  DUMMY_BUDGET_ELEMENT = DUMMY_BUDGET_ELEMENT.filter(
    ({ id }) => id !== budgetElementId
  );

  res.status(200).json({ message: 'Deleted budget element!' });
};

exports.getBudgetElementById = getBudgetElementById;
exports.getBudgetElementsByUserId = getBudgetElementsByUserId;
exports.createBudgetElement = createBudgetElement;
exports.updateBudgetElement = updateBudgetElement;
exports.deleteBudgetElement = deleteBudgetElement;
