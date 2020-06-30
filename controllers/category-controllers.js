const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const Category = require('../models/category');
const BudgetElement = require('../models/budget-element');
const User = require('../models/user');

const getCategoryById = async (req, res, next) => {
  const categoryId = req.params.cid;

  let category;
  try {
    category = await Category.findById(categoryId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find a category.',
      500
    );
    return next(error);
  }

  if (!category) {
    const error = new HttpError(
      'Could not find a category for the provided id.',
      404
    );
    return next(error);
  }

  res.json({ category: category.toObject({ getters: true }) });
};

const getCategoriesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let categories;
  let filteredCategories;
  try {
    categories = await Category.find({ user: userId });
    filteredCategories = await BudgetElement.aggregate([
      {
        $group: {
          _id: '$category',
          total: {
            $sum: '$amount',
          },
        },
      },
    ]);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find a categories by user ID.',
      500
    );
    return next(error);
  }

  if (!categories || categories.length === 0) {
    return next(
      new HttpError(
        'Could not find a categories for the provided user id.',
        404
      )
    );
  }

  //update category sum value
  categories.forEach((category) => {
    if (category.budgetElements.length > 0) {
      const catId = category._id.toString();
      const categoryToUpdate = filteredCategories.find((cur) => {
        return cur._id == catId;
      });
      category.sum = categoryToUpdate.total;
    }
    return;
  });

  res.json({
    categories: categories.map((category) =>
      category.toObject({ getters: true })
    ),
  });
};

const createCategory = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid input passed, please check your data', 422)
    );
  }

  const { name, user, type } = req.body;
  const createdCategory = new Category({
    name,
    type,
    budgetElements: [],
    user,
    sum: 0,
  });

  let userId;
  try {
    userId = await User.findById(user);
  } catch (err) {
    return next(
      new HttpError('Creating category failed, please try again.', 500)
    );
  }

  if (!userId) {
    return next(new HttpError('Could not find user for provided id.', 404));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdCategory.save({ session: sess });
    userId.categories.push(createdCategory);
    await userId.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    return next(
      new HttpError('Creating new category failed, please try again.', 500)
    );
  }

  res.status(201).json({ categories: createdCategory });
};

const updateCategory = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError('Invalid input passed, please check your data', 422);
  }

  const { name } = req.body;
  const categoryId = req.params.cid;

  let category;
  try {
    category = await Category.findById(categoryId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, please try update again.',
      500
    );
    return next(error);
  }

  category.name = name;

  try {
    await category.save();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, please try update again.',
      500
    );
    return next(error);
  }

  res.status(200).json({ categories: category.toObject({ getters: true }) });
};

const deleteCategory = async (req, res, next) => {
  const categoryId = req.params.cid;

  let category;
  try {
    category = await Category.findById(categoryId).populate('user');
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, please try delete category again.',
      500
    );
    return next(error);
  }

  if (!category) {
    return next(
      new HttpError('Something went wrong, could not delete category!')
    );
  }

  if (category.budgetElements.length > 0) {
    return next(
      new HttpError(
        'Before you delete category, you must delete budget elements!'
      )
    );
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await category.remove({ session: session });
    category.user.categories.pull(category);
    await category.user.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    return next(
      new HttpError(
        'Something went wrong, please try delete category again.',
        500
      )
    );
  }

  res.status(200).json({ message: 'Deleted category!' });
};

exports.getCategoryById = getCategoryById;
exports.getCategoriesByUserId = getCategoriesByUserId;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
