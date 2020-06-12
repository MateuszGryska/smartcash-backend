const express = require('express');
const bodyParser = require('body-parser');

const budgetRoutes = require('./routes/budget-routes');

const app = express();

app.use('/api/budget', budgetRoutes);

app.listen(5000);
