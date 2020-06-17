const uuid = require('uuid');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');

const DUMMY_USERS = [
  {
    id: 'u1',
    firstName: 'Joe',
    lastName: 'Example',
    email: 'joeexample@gmail.com',
    password: 'haslo123',
    phoneNumber: '555434333',
    country: 'Poland',
  },
];

const getUsers = (req, res, next) => {
  res.status(200).json({ users: DUMMY_USERS });
};

const signUp = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError('Invalid input passed, please check your data', 422);
  }

  const { firstName, lastName, email, password } = req.body;

  const hasUser = DUMMY_USERS.find((u) => u.email === email);

  if (hasUser) {
    throw new HttpError('could not create user, email already exists!', 422);
  }

  const createdNewUser = {
    id: uuid.v4(),
    email,
    password,
    firstName,
    lastName,
  };

  DUMMY_USERS.push(createdNewUser);

  res.status(201).json({ newUser: createdNewUser });
};

const login = (req, res, next) => {
  const { email, password } = req.body;

  const identifiedUser = DUMMY_USERS.find((u) => u.email === email);

  if (!identifiedUser || identifiedUser.password !== password) {
    throw new HttpError(
      'Could not identify user, credentials seem to be wrong!',
      401
    );
  }

  res.json({ message: 'logged in!' });
};

exports.getUsers = getUsers;
exports.login = login;
exports.signUp = signUp;
