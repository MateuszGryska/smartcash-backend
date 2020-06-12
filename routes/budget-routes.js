const express = require('express');

const router = express.Router();

router.get('/', (req, res, next) => {
  console.log('GET REQ IN BUDGET');
  res.json({ message: 'it works' });
});

module.exports = router;
