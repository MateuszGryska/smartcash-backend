const uuid = require('uuid');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const User = require('../models/user');

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, '-password');
  } catch (err) {
    return next(
      new HttpError('Fetching users failed, please try again later!', 500)
    );
  }

  res
    .status(200)
    .json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const getUserById = async (req, res, next) => {
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find a user.',
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      'Could not find a user for the provided id.',
      404
    );
    return next(error);
  }

  res.json({ user: user.toObject({ getters: true }) });
};

const signUp = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid input passed, please check your data', 422)
    );
  }

  const { firstName, lastName, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError('Sign up failed, please try again later.', 500);
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      'User exists already, please login instead.',
      422
    );
    return next(error);
  }

  const createdNewUser = new User({
    firstName,
    lastName,
    email,
    password,
    phoneNumber: 0,
    country: 'Add country!',
    budgetElements: [],
    categories: [],
    image: '',
  });

  try {
    await createdNewUser.save();
  } catch (err) {
    const error = new HttpError('Signing up failed, please try again.', 500);
    return next(error);
  }

  res.status(201).json({ user: createdNewUser.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError('Sign up failed, please try again later.', 500);
    return next(error);
  }

  if (!existingUser || existingUser.password !== password) {
    return next(
      new HttpError('Invalid credentials, could not log you in!', 401)
    );
  }

  res.json({ message: 'logged in!' });
};

const updateUserAvatar = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError('Invalid input passed, please check your data', 422);
  }

  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, please try update again.',
      500
    );
    return next(error);
  }

  user.image = req.file.path;
  // user.date = Date.now();

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, please try update again.',
      500
    );
    return next(error);
  }

  res.status(200).json({ image: user.image });
};

const updateUserData = async (req, res, next) => {
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   throw new HttpError('Invalid input passed, please check your data', 422);
  // }
  // const { name } = req.body;
  // const categoryId = req.params.cid;
  // let category;
  // try {
  //   category = await Category.findById(categoryId);
  // } catch (err) {
  //   const error = new HttpError(
  //     'Something went wrong, please try update again.',
  //     500
  //   );
  //   return next(error);
  // }
  // category.name = name;
  // category.date = Date.now();
  // try {
  //   await category.save();
  // } catch (err) {
  //   const error = new HttpError(
  //     'Something went wrong, please try update again.',
  //     500
  //   );
  //   return next(error);
  // }
  // res.status(200).json({ categories: category.toObject({ getters: true }) });
};

exports.getUsers = getUsers;
exports.getUserById = getUserById;
exports.login = login;
exports.signUp = signUp;
exports.updateUserAvatar = updateUserAvatar;
exports.updateUserData = updateUserData;
