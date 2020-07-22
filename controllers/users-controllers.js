const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const User = require('../models/user');
const Category = require('../models/category');
const BudgetElement = require('../models/budget-element');
const Wallet = require('../models/wallet');

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
      'User already exists, please login instead.',
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(
      new HttpError('Could not create a user, please try again.', 422)
    );
  }

  const createdNewUser = new User({
    firstName,
    lastName,
    email,
    password: hashedPassword,
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

  let token;
  try {
    token = jwt.sign(
      { userId: createdNewUser.id, email: createdNewUser.email },
      process.env.JWT_KEY,
      { expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError('Signing up failed, please try again.', 500);
    return next(error);
  }

  res.status(201).json({
    userId: createdNewUser.id,
    email: createdNewUser.email,
    token: token,
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    const error = new HttpError('Sign in failed, please try again later.', 500);
    return next(error);
  }

  if (!existingUser) {
    return next(
      new HttpError('Invalid email or password, could not log you in!', 403)
    );
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return next(
      new HttpError(
        'Could not log you in, please check your email and password and try again.',
        500
      )
    );
  }

  if (!isValidPassword) {
    return next(
      new HttpError('Invalid email or password, could not log you in.', 403)
    );
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError('Sign in failed, please try again later.', 500);
    return next(error);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError('Invalid input passed, please check your data', 422);
  }

  const { firstName, lastName, email, phoneNumber, country } = req.body;
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
  user.firstName = firstName;
  user.lastName = lastName;
  user.email = email;
  user.phoneNumber = phoneNumber;
  user.country = country;

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, please try update again.',
      500
    );
    return next(error);
  }
  res.status(200).json({ users: user.toObject({ getters: true }) });
};

const deleteUser = async (req, res, next) => {
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById(userId).populate('categories');
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, please try delete user again.',
      500
    );
    return next(error);
  }

  if (!user) {
    return next(new HttpError('Something went wrong, could not delete user!'));
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await user.remove({ session: session });
    await BudgetElement.deleteMany({ user: userId }, { session: session });
    await Wallet.deleteMany({ user: userId }, { session: session });
    await Category.deleteMany({ user: userId }, { session: session });
    await session.commitTransaction();
  } catch (err) {
    return next(
      new HttpError(`Something went wrong, please try deletee user again.`, 500)
    );
  }

  res.status(200).json({ message: 'Deleted user!' });
};

const updatePassword = async (req, res, next) => {
  const { password } = req.body;
  const userId = req.params.uid;

  let existingUser;
  try {
    existingUser = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(
      'Update password failed, please try again later.',
      500
    );
    return next(error);
  }

  if (!existingUser) {
    return next(
      new HttpError('Something went wrong, could not update password!', 403)
    );
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return next(
      new HttpError('Something went wrong, could not update password.', 500)
    );
  }

  if (isValidPassword) {
    return next(new HttpError('This is the same password.', 403));
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(
      new HttpError('Could not update password, please try again.', 422)
    );
  }

  existingUser.password = hashedPassword;

  try {
    await existingUser.save();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, please try update again.',
      500
    );
    return next(error);
  }

  res.status(200).json({ users: existingUser.toObject({ getters: true }) });
};

exports.getUsers = getUsers;
exports.getUserById = getUserById;
exports.login = login;
exports.signUp = signUp;
exports.updateUserAvatar = updateUserAvatar;
exports.updateUserData = updateUserData;
exports.deleteUser = deleteUser;
exports.updatePassword = updatePassword;
