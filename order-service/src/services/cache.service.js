const { redisClient } = require("../config/redis");

const serialize = (value) => JSON.stringify(value);
const deserialize = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
};

const isRedisAvailable = () => {
  if (!redisClient) {
    return false;
  }

  return redisClient.isReady || redisClient.isOpen;
};

const get = async (key) => {
  try {
    if (!isRedisAvailable()) {
      return null;
    }

    const rawValue = await redisClient.get(key);
    return deserialize(rawValue);
  } catch (error) {
    console.error("Redis get failed:", { key, message: error.message });
    return null;
  }
};

const set = async (key, value, ttlSeconds = 60) => {
  try {
    if (!isRedisAvailable()) {
      return false;
    }

    const ttl = Number(ttlSeconds);
    const expiry = Number.isFinite(ttl) && ttl > 0 ? ttl : 60;

    await redisClient.set(key, serialize(value), {
      EX: expiry
    });

    return true;
  } catch (error) {
    console.error("Redis set failed:", { key, message: error.message });
    return false;
  }
};

const del = async (key) => {
  try {
    if (!isRedisAvailable()) {
      return 0;
    }

    return await redisClient.del(key);
  } catch (error) {
    console.error("Redis delete failed:", { key, message: error.message });
    return 0;
  }
};

const delByPattern = async (pattern) => {
  try {
    if (!isRedisAvailable()) {
      return 0;
    }

    const keys = await redisClient.keys(pattern);

    if (!keys.length) {
      return 0;
    }

    const deletedCount = await redisClient.del(keys);
    return deletedCount;
  } catch (error) {
    console.error("Redis pattern delete failed:", { pattern, message: error.message });
    return 0;
  }
};

module.exports = {
  get,
  set,
  del,
  delByPattern
};
