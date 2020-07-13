const { Router } = require('express');
const { check } = require('express-validator');

const categoryControllers = require('../controllers/category-controllers');
const checkAuth = require('../middleware/check-auth');

const router = Router();

router.use(checkAuth);

router.get('/:cid', categoryControllers.getCategoryById);

router.get('/user/:uid', categoryControllers.getCategoriesByUserId);

router.post(
  '/',
  [check('name').not().isEmpty()],
  categoryControllers.createCategory
);

router.patch(
  '/:cid',
  [check('name').not().isEmpty()],
  categoryControllers.updateCategory
);

router.delete('/:cid', categoryControllers.deleteCategory);

module.exports = router;
