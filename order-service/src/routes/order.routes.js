
const express = require("express");
const orderController = require("../controllers/order.controller");
const { createOrderSchema } = require("../validators/order.validator");
const validate = require("../middlewares/validate");

const router = express.Router();

router.post("/",   validate(createOrderSchema), orderController.createOrder);
router.get("/", orderController.getOrders);
router.get("/:orderId", orderController.getOrderById);

router.patch("/:orderId", orderController.updateOrder);

router.patch("/:orderId/cancel", orderController.cancelOrder);

module.exports = router;
