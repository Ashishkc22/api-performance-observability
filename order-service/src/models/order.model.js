const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true,
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        minL: 0
    }
},{_id: false})