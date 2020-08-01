const { Router } = require('express');
const { check } = require('express-validator');

const walletControllers = require('../controllers/wallet-controllers');
const checkAuth = require('../middleware/check-auth');

const router = Router();

router.use(checkAuth);

router.get('/:wid', walletControllers.getWalletById);

router.get('/user/:uid', walletControllers.getWalletsByUserId);

router.post(
  '/',
  [check('name').not().isEmpty()],
  walletControllers.createWallet
);

router.patch(
  '/:wid',
  [check('name').not().isEmpty()],
  walletControllers.updateWallet
);

router.delete('/:wid', walletControllers.deleteWallet);

module.exports = router;
