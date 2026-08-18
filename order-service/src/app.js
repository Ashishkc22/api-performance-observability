require("dotenv").config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require("./config/database");

// const orderRoutes = require('./routes/order.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

connectDB()

// app.use('/orders',orderRoutes);

module.exports = app;

