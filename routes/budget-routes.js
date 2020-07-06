const { Router } = require('express');
const { check } = require('express-validator');

const budgetControllers = require('../controllers/budget-controllers');
const checkAuth = require('../middleware/check-auth');

const router = Router();

router.use(checkAuth);

router.get('/:bid', budgetControllers.getBudgetElementById);

router.get('/user/:uid', budgetControllers.getBudgetElementsByUserId);

router.post(
  '/',
  [check('name').not().isEmpty(), check('amount').not().isEmpty()],
  budgetControllers.createBudgetElement
);

router.patch(
  '/:bid',
  [
    check('name').not().isEmpty(),
    check('amount').not().isEmpty(),
    check('wallet').not().isEmpty(),
    check('category').not().isEmpty(),
  ],
  budgetControllers.updateBudgetElement
);

router.delete('/:bid', budgetControllers.deleteBudgetElement);

module.exports = router;
