const ioRedis = require("ioredis");

const config = require("./config");

const redisConnection = new ioRedis({
  host: config.bull.redis.url,
  db: config.bull.redis.db,
  tls: config.bull.redis.tls,
});

exports.redisStoreKeys = {
  activeUsers: "active_users",
};

exports.redisConnection = redisConnection;
