const { createClient } = require("redis");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const client = createClient({
  url: REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        return new Error("Redis reconnect retries exceeded");
      }

      return Math.min(retries * 100, 2000);
    }
  }
});

client.on("connect", () => {
  console.log("Redis connected");
});

client.on("ready", () => {
  console.log("Redis ready");
});

client.on("error", (error) => {
  console.error("Redis client error:", error.message);
});

client.on("end", () => {
  console.log("Redis connection closed");
});

const connectRedis = async () => {
  try {
    if (!client.isOpen) {
      await client.connect();
    }

    return client;
  } catch (error) {
    console.error("Redis connection failed:", error.message);
    return null;
  }
};

module.exports = {
  redisClient: client,
  connectRedis
};
