const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
    productId: {
      type: String,
      required: true,
      trim: true
    },

    productName: {
      type: String,
      required: true,
      trim: true
    },

    sku: {
      type: String,
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
      min: 0
    },

    discount: {
      type: Number,
      default: 0,
      min: 0
    },

    tax: {
      type: Number,
      default: 0,
      min: 0
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
},{_id: false})

const orderSchema = new mongoose.Schema({
   customerId: {
    type: String,
    required: true,
    index: true,
    trim: true
   },
   items: {
    type: [orderItemSchema],
    required: true,
    validate: {
        validator: function (items) {
            return items.length > 0;
        },
        message: "Order must contain at least one item."
    }
   },
   totalAmount: {
    type: Number,
    required: true,
    min: 0
   },
   currency: {
    type: String,
    required: true,
    default: "INR",
    uppercase: true,
    trim: true
   },
   status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled"
      ],
      default: "pending",
      index: true
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "authorized",
        "paid",
        "failed",
        "refunded"
      ],
      default: "pending"
    },

    shippingAddress: {
      addressLine1: {
        type: String,
        trim: true
      },

      addressLine2: {
        type: String,
        trim: true
      },

      city: {
        type: String,
        trim: true
      },

      state: {
        type: String,
        trim: true
      },

      postalCode: {
        type: String,
        trim: true
      },

      country: {
        type: String,
        trim: true,
        default: "India"
      }
    }
  },
{
    timestamps: true
  })
  orderSchema.index({ status: 1, createdAt: -1 });
const Order = mongoose.model("Order", orderSchema);

module.exports = Order;