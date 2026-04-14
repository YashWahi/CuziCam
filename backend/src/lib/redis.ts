import Redis from 'ioredis-mock';

// SWAP TO PRODUCTION: replace ioredis-mock with ioredis and set REDIS_URL in .env
const redis = new Redis();

export const connectRedis = async () => {
  // ioredis-mock connects immediately, but we keep this for compatibility
  console.log('[Redis] Mock initialized (ioredis-mock)');
};

export { redis };
