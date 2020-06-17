const { Router } = require('express');
const { check } = require('express-validator');

const budgetControllers = require('../controllers/budget-controllers');

const router = Router();

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
