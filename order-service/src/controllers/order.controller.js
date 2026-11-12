
const orderService = require("../services/order.service");

const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.body);

    return res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const result = await orderService.getOrders(req.query);

    return res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const order = await orderService.updateOrder(
      req.params.orderId,
      req.body
    );

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const order = await orderService.cancelOrder(req.params.orderId);

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getOrders,
  updateOrder,
  cancelOrder
};
