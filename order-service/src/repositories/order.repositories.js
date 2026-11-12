const { isValidObjectId } = require("mongoose");
const Order = require("../models/order.model");

const create = async (orderData) => {
    return await Order.create(orderData);
};

const findById = async (orderId) => {
    if (!isValidObjectId(orderId)) {
        throw new Error("Invalid order ID");
    }

    return await Order.findById(orderId);
};

const findMany = async (filter = {}, options = {}) => {
    const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;

    return Order.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);
};

const count = async (filter = {}) => {
  return Order.countDocuments(filter);
};

const updateById = async (orderId, updateData) => {
  return Order.findByIdAndUpdate(
    orderId,
    updateData,
    {
      new: true,
      runValidators: true
    }
  );
};

const updateStatus = async (orderId, status) => {
  return Order.findByIdAndUpdate(
    orderId,
    { status },
    {
      new: true,
      runValidators: true
    }
  );
};

module.exports = {
    create,
    findById,
    findMany,
    count,
    updateById,
    updateStatus
}