const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const budgetRoutes = require('./routes/budget-routes');
const categoryRoutes = require('./routes/category-routes');
const walletRoutes = require('./routes/wallet-routes');
const userRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

const app = express();

app.use(bodyParser.json());

app.use('/api/budget', budgetRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/users', userRoutes);

app.use((req, res, next) => {
  const error = new HttpError('could not find this route', 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res
    .status(error.code || 500)
    .json({ message: error.message || 'an unknown error occurred' });
});
mongoose
  .connect(
    'mongodb+srv://mateuszg:wrT3fVeGeuaHdG07@cluster0-x1lnh.mongodb.net/smartcashdb?retryWrites=true&w=majority'
  )
  .then(() => {
    console.log('DATABASE CONNECTED!');
    app.listen(5000);
  })
  .catch((err) => console.log(err));
