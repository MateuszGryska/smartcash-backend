const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const Wallet = require('../models/wallet');
const User = require('../models/user');

const getWalletById = async (req, res, next) => {
  const walletId = req.params.wid;

  let wallet;
  try {
    wallet = await Wallet.findById(walletId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find a wallet.',
      500
    );
    return next(error);
  }

  if (!wallet) {
    const error = new HttpError(
      'Could not find a wallet for the provided id.',
      404
    );
    return next(error);
  }

  res.json({ wallet: wallet.toObject({ getters: true }) });
};

const getWalletsByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let wallets;
  try {
    wallets = await Wallet.find({ user: userId });
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find a wallets by user.',
      500
    );
    return next(error);
  }

  if (!wallets || wallets.length === 0) {
    return next(
      new HttpError('Could not find a wallets for the provided user.', 404)
    );
  }

  res.json({
    wallets: wallets.map((wallet) => wallet.toObject({ getters: true })),
  });
};

const createWallet = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid input passed, please check your data', 422)
    );
  }

  const { name, sum } = req.body;
  const createdWallet = new Wallet({
    name,
    budgetElements: [],
    user: req.userData.userId,
    sum,
  });

  let userId;
  try {
    userId = await User.findById(req.userData.userId);
  } catch (err) {
    return next(
      new HttpError('Creating wallet failed, please try again.', 500)
    );
  }

  if (!userId) {
    return next(new HttpError('Could not find user for provided id.', 404));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdWallet.save({ session: sess });
    userId.wallets.push(createdWallet);
    await userId.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    return next(
      new HttpError('Creating new wallet failed, please try again.', 500)
    );
  }

  res.status(201).json({ wallets: createdWallet });
};

const updateWallet = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError('Invalid input passed, please check your data', 422);
  }

  const { name } = req.body;
  const walletId = req.params.wid;

  let wallet;
  try {
    wallet = await Wallet.findById(walletId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, please try update again.',
      500
    );
    return next(error);
  }

  wallet.name = name;
  wallet.date = Date.now();

  try {
    await wallet.save();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, please try update again.',
      500
    );
    return next(error);
  }

  res.status(200).json({ wallets: wallet.toObject({ getters: true }) });
};

const deleteWallet = async (req, res, next) => {
  const walletId = req.params.wid;

  let wallet;
  try {
    wallet = await Wallet.findById(walletId).populate('user');
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, please try delete wallet again.',
      500
    );
    return next(error);
  }

  if (!wallet) {
    return next(
      new HttpError('Something went wrong, could not delete wallet!')
    );
  }

  if (wallet.budgetElements.length > 0) {
    return next(
      new HttpError(
        'Before you delete wallet, you must delete budget elements!'
      )
    );
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await wallet.remove({ session: session });
    wallet.user.wallets.pull(wallet);
    await wallet.user.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    return next(
      new HttpError(
        'Something went wrong, please try delete wallet again.',
        500
      )
    );
  }

  res.status(200).json({ message: 'Deleted wallet!' });
};

exports.getWalletById = getWalletById;
exports.getWalletsByUserId = getWalletsByUserId;
exports.createWallet = createWallet;
exports.updateWallet = updateWallet;
exports.deleteWallet = deleteWallet;
