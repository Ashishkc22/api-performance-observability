const Joi = require("joi");

const createOrderSchema = Joi.object({
  customerId: Joi.string().required(),

  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required(),
        productName: Joi.string().required(),
        sku: Joi.string().optional(),
        quantity: Joi.number().integer().min(1).required(),
        price: Joi.number().min(0).required(),
        discount: Joi.number().min(0).default(0),
        tax: Joi.number().min(0).default(0)
      })
    )
    .min(1)
    .required(),

  currency: Joi.string().length(3).default("INR"),

  shippingAddress: Joi.object({
    addressLine1: Joi.string().optional(),
    addressLine2: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    postalCode: Joi.string().optional(),
    country: Joi.string().default("India")
  }).optional()
});

module.exports = { createOrderSchema };