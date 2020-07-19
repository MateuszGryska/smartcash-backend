const express = require('express');
const { check } = require('express-validator');
const fileUpload = require('../middleware/file-upload');

const usersControllers = require('../controllers/users-controllers');

const router = express.Router();

router.get('/', usersControllers.getUsers);

router.get('/:uid', usersControllers.getUserById);

router.post(
  '/signup',
  [
    check('firstName').not().isEmpty(),
    check('lastName').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({ min: 6 }),
  ],
  usersControllers.signUp
);

router.post('/login', usersControllers.login);

router.patch('/:uid', usersControllers.updateUserData);

router.patch(
  '/image/:uid',
  fileUpload.single('image'),
  usersControllers.updateUserAvatar
);

router.patch('/password/:uid', usersControllers.updatePassword);

router.delete('/:uid', usersControllers.deleteUser);

module.exports = router;
