const { Router } = require('express');
const { check } = require('express-validator');

const categoryControllers = require('../controllers/category-controllers');

const router = Router();

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
