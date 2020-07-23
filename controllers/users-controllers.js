const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');

const HttpError = require('../models/http-error');
const User = require('../models/user');
const Category = require('../models/category');
const BudgetElement = require('../models/budget-element');
const Wallet = require('../models/wallet');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// const transporter = nodemailer.createTransport(
//   sendgridTransport({
//     auth: {
//       api_key: process.env.SENDGRID_API_KEY,
//     },
//   })
// );

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

const resetPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError('Invalid input passed, please check your data', 422);
  }
  let resetToken;
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
    }
    resetToken = buffer.toString('hex');
  });

  const { email } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Reset password failed, please try again later.',
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      'User don&#39;t exists, please sign up or try again instead.',
      422
    );
    return next(error);
  }

  existingUser.resetToken = resetToken;
  existingUser.expireToken = Date.now() + 3600000;

  try {
    await existingUser.save();
    const msg = {
      to: existingUser.email,
      from: 'matthew.gryska@gmail.com',
      subject: 'reset password request',
      html: `
        <h1>Hi ${existingUser.firstName}</h1>
        <p>Click in this <a href="http://localhost:3000/reset/${resetToken}">link</a> to reset password.</p>
      `,
    };
    sgMail.send(msg);
  } catch (err) {
    const error = new HttpError(
      `'Something went wrong, please try update again. ${err}'`,
      500
    );
    return next(error);
  }

  res.json({ message: 'You can check your email!' });
};

const setNewPassword = async (req, res, next) => {
  const { password, resetToken } = req.body;

  let user;
  try {
    user = await User.findOne({
      resetToken: resetToken,
      expireToken: { $gt: Date.now() },
    });
  } catch (err) {
    const error = new HttpError(
      'Update password failed, please try again later.',
      500
    );
    return next(error);
  }

  if (!user) {
    return next(
      new HttpError('Something went wrong, could not update password!', 403)
    );
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, user.password);
  } catch (err) {
    console.log(err);
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

  user.password = hashedPassword;
  user.resetToken = undefined;
  user.expireToken = undefined;

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, please try update again.',
      500
    );
    return next(error);
  }

  res.status(200).json({ message: 'Password was updated!' });
};

exports.getUsers = getUsers;
exports.getUserById = getUserById;
exports.login = login;
exports.signUp = signUp;
exports.updateUserAvatar = updateUserAvatar;
exports.updateUserData = updateUserData;
exports.deleteUser = deleteUser;
exports.updatePassword = updatePassword;
exports.resetPassword = resetPassword;
exports.setNewPassword = setNewPassword;
