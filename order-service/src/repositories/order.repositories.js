const Order = require("../models/order.model");

const create = async (orderData) => {
    return await Order.create(orderData);
}
const findById = async (orderId) => {
    return await Order.findById({id: orderId })
}
const findMany = async (filter = {}) => {
    return await order.find(filter)
}


module.exports = {
create,
findById,
findMany
}