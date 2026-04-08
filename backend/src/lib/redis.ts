import { createClient } from 'redis';

const client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });

client.on('error', (err) => console.error('[Redis] Client Error', err));
client.on('connect', () => console.log('[Redis] Connected'));

export const connectRedis = async () => {
  if (!client.isOpen) await client.connect();
};

export { client as redis };
