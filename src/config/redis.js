const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL, {
  tls: process.env.REDIS_URL?.startsWith('rediss://') ? {} : undefined,
});

redis.on('error', (err) => console.error('Redis error:', err.message));

module.exports = redis;