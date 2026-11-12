require("dotenv").config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require("./config/database");
const { connectRedis } = require("./config/redis");

const orderRoutes = require('./routes/order.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

connectDB();
connectRedis();

app.use('/orders',orderRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

module.exports = app;

