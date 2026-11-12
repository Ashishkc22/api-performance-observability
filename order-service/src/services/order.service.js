
const orderRepository = require("../repositories/order.repositories");
const cacheService = require("./cache.service");
const mongoose = require("mongoose");
const { performance } = require("perf_hooks");

const logTiming = (operation, cacheState, durationMs) => {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.log(
    JSON.stringify({
      operation,
      cache: cacheState,
      durationMs: Number(durationMs.toFixed(2))
    })
  );
};

const invalidateOrderCaches = async (orderId) => {
  if (!orderId) {
    return;
  }

  await cacheService.del(`order:${orderId}`);
  await cacheService.delByPattern("orders:list:*");
};

const buildOrdersCacheKey = (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(query.limit, 10) || 10, 1),
    100
  );

  const filterStatus = query.status || "all";
  const customerId = query.customerId || "all";
  const sortBy = ["createdAt", "totalAmount"].includes(query.sortBy)
    ? query.sortBy
    : "createdAt";
  const sortOrder = query.order === "asc" ? "asc" : "desc";

  return `orders:list:${JSON.stringify({
    page,
    limit,
    status: filterStatus,
    customerId,
    sortBy,
    order: sortOrder
  })}`;
};

const createOrder = async (orderData) => {
    if (!orderData.customerId) {
        throw new Error("Customer ID is required");
    }

    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
        throw new Error("Order must contain at least one item");
    }

    const items = orderData.items.map((item) => {
        const subtotal =
            item.quantity * item.price -
            (item.discount || 0) +
            (item.tax || 0);

        if (
            !Number.isFinite(item.quantity) ||
            item.quantity < 1 ||
            !Number.isFinite(item.price) ||
            item.price < 0 ||
            !Number.isFinite(subtotal) ||
            subtotal < 0
        ) {
            throw new Error("Invalid order item or amount");
        }

        return {
            ...item,
            subtotal
        };
    });

    const totalAmount = items.reduce(
        (total, item) => total + item.subtotal,
        0
    );

    const order = await orderRepository.create({
        ...orderData,
        items,
        totalAmount
    });

    await invalidateOrderCaches(order?._id?.toString());

    return order;
};

const getOrderById = async (orderId) => {
    const serviceStart = performance.now();

    if (!mongoose.isValidObjectId(orderId)) {
        const error = new Error("Invalid order ID");
        error.statusCode = 400;
        throw error;
    }

    const cacheKey = `order:${orderId}`;
    const cacheStart = performance.now();
    const cachedOrder = await cacheService.get(cacheKey);
    const cacheDuration = performance.now() - cacheStart;

    if (cachedOrder) {
      logTiming("getOrderById", "HIT", cacheDuration + (performance.now() - serviceStart));
      return cachedOrder;
    }

    logTiming("getOrderById", "MISS", cacheDuration);

    const mongoStart = performance.now();
    const order = await orderRepository.findById(orderId);
    const mongoDuration = performance.now() - mongoStart;

    if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
    }

    await cacheService.set(cacheKey, order, 60);

    logTiming("getOrderById", "MISS", performance.now() - serviceStart);
    logTiming("getOrderById", "DB_READ", mongoDuration);

    return order;
};

const getOrders = async (query = {}) => {
    const cacheKey = buildOrdersCacheKey(query);
    const cacheStart = performance.now();
    const cachedResult = await cacheService.get(cacheKey);
    const cacheDuration = performance.now() - cacheStart;

    if (cachedResult) {
      logTiming("getOrders", "HIT", cacheDuration);
      return cachedResult;
    }

    logTiming("getOrders", "MISS", cacheDuration);

    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(
        Math.max(parseInt(query.limit, 10) || 10, 1),
        100
    );

    const skip = (page - 1) * limit;

    const filter = {};

    if (query.status) {
        const allowedStatuses = [
            "pending",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
            "cancelled"
        ];

        if (!allowedStatuses.includes(query.status)) {
            const error = new Error("Invalid order status");
            error.statusCode = 400;
            throw error;
        }

        filter.status = query.status;
    }

    if (query.customerId) {
        filter.customerId = query.customerId;
    }

    const allowedSortFields = ["createdAt", "totalAmount"];
    const sortBy = allowedSortFields.includes(query.sortBy)
        ? query.sortBy
        : "createdAt";

    const sortOrder = query.order === "asc" ? 1 : -1;

    const options = {
        skip,
        limit,
        sort: { [sortBy]: sortOrder }
    };

    const mongoStart = performance.now();
    const [orders, totalOrders] = await Promise.all([
        orderRepository.findMany(filter, options),
        orderRepository.count(filter)
    ]);
    const mongoDuration = performance.now() - mongoStart;

    const result = {
        orders,
        pagination: {
            currentPage: page,
            pageSize: limit,
            totalOrders,
            totalPages: Math.ceil(totalOrders / limit)
        }
    };

    await cacheService.set(cacheKey, result, 60);

    logTiming("getOrders", "DB_READ", mongoDuration);
    logTiming("getOrders", "MISS", performance.now() - cacheStart);

    return result;
};

const updateOrder = async (orderId, updateData) => {
  if (!mongoose.isValidObjectId(orderId)) {
    const error = new Error("Invalid order ID");
    error.statusCode = 400;
    throw error;
  }

  const existingOrder = await orderRepository.findById(orderId);

  if (!existingOrder) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  if (!["pending", "confirmed"].includes(existingOrder.status)) {
    const error = new Error("Order cannot be updated at this stage");
    error.statusCode = 400;
    throw error;
  }

  const allowedFields = ["shippingAddress"];

  const filteredData = {};

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      filteredData[field] = updateData[field];
    }
  }

  const updatedOrder = await orderRepository.updateById(orderId, filteredData);
  await invalidateOrderCaches(orderId);

  return updatedOrder;
};

const cancelOrder = async (orderId) => {
  if (!mongoose.isValidObjectId(orderId)) {
    const error = new Error("Invalid order ID");
    error.statusCode = 400;
    throw error;
  }

  const order = await orderRepository.findById(orderId);

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  if (!["pending", "confirmed", "processing"].includes(order.status)) {
    const error = new Error("Order cannot be cancelled");
    error.statusCode = 400;
    throw error;
  }

  const cancelledOrder = await orderRepository.updateStatus(orderId, "cancelled");
  await invalidateOrderCaches(orderId);

  return cancelledOrder;
};

module.exports = {
    createOrder,
    getOrderById,
    getOrders,
    updateOrder,
    cancelOrder
};
