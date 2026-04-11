import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';

export interface QueueEntry {
  userId: string;
  socketId: string;
  collegeId: string;
  interests: string[];
  year?: string;
  vibeScore: number;
  gender?: string;
  mode: string;
  filters: {
    genderPref?: string;
    sameCollege?: boolean;
    sameBranch?: boolean;
    branch?: string;
  };
  joinedAt: number;
}

const MAIN_QUEUE_KEY = 'queue:pool';
const CHAOS_WINDOW_KEY = 'chaos:active';

export const isChaosWindowActive = async (): Promise<boolean> => {
  const val = await redis.get(CHAOS_WINDOW_KEY);
  return val === 'true';
};

export const setChaosWindow = async (active: boolean, ttlSeconds?: number): Promise<void> => {
  if (active && ttlSeconds) {
    await redis.set(CHAOS_WINDOW_KEY, 'true', 'EX', ttlSeconds);
  } else if (active) {
    await redis.set(CHAOS_WINDOW_KEY, 'true');
  } else {
    await redis.del(CHAOS_WINDOW_KEY);
  }
};

export const enqueue = async (entry: QueueEntry): Promise<void> => {
  await redis.zadd(MAIN_QUEUE_KEY, entry.joinedAt, JSON.stringify(entry));
  await redis.set(`session:${entry.socketId}`, JSON.stringify(entry), 'EX', 3600);
};

export const dequeue = async (socketId: string): Promise<void> => {
  const sessionData = await redis.get(`session:${socketId}`);
  if (!sessionData) return;
  await redis.zrem(MAIN_QUEUE_KEY, sessionData);
  await redis.del(`session:${socketId}`);
};

const computeMatchScore = (a: QueueEntry, b: QueueEntry, chaosActive: boolean): number => {
  let score = 0;

  // +40 if shared interests (parse JSON string if needed, but here it's already an array in QueueEntry)
  const sharedInterests = a.interests.filter((i) => b.interests.includes(i));
  if (sharedInterests.length > 0) score += 40;

  // +25 if same college
  if (a.collegeId === b.collegeId) score += 25;

  // +15 if same year
  if (a.year && a.year === b.year) score += 15;

  // +10 if same mode preference
  if (a.mode === b.mode) score += 10;

  // +10 wait bonus (1pt per 5 seconds in queue, max 10)
  const waitA = (Date.now() - a.joinedAt) / 5000;
  const waitB = (Date.now() - b.joinedAt) / 5000;
  score += Math.min(10, Math.floor(waitA + waitB));

  // return -1 if gender preference doesn't match AND chaos is not active
  if (!chaosActive) {
    if (a.filters.genderPref && a.filters.genderPref !== b.gender) return -1;
    if (b.filters.genderPref && b.filters.genderPref !== a.gender) return -1;
  }

  return score;
};

export const findBestMatch = async (entry: QueueEntry): Promise<QueueEntry | null> => {
  const chaosActive = await isChaosWindowActive();
  const rawEntries = await redis.zrange(MAIN_QUEUE_KEY, 0, -1);

  // Threshold starts at 60, decreases by 10 every 15 seconds of waiting, floor at 20
  const waitSeconds = (Date.now() - entry.joinedAt) / 1000;
  const threshold = Math.max(20, 60 - Math.floor(waitSeconds / 15) * 10);

  let bestMatch: QueueEntry | null = null;
  let bestScore = -1;

  for (const raw of rawEntries) {
    const candidate: QueueEntry = JSON.parse(raw);
    if (candidate.socketId === entry.socketId || candidate.userId === entry.userId) continue;

    // Check blocks
    const isBlocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: entry.userId, blockedId: candidate.userId },
          { blockerId: candidate.userId, blockedId: entry.userId },
        ],
      },
    });
    if (isBlocked) continue;

    const score = computeMatchScore(entry, candidate, chaosActive);
    if (score >= threshold && score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  return bestMatch;
};

export const setActiveSession = async (socketIdA: string, socketIdB: string, sessionId: string) => {
  const data = JSON.stringify({ sessionId, partner: socketIdB });
  const dataB = JSON.stringify({ sessionId, partner: socketIdA });
  await redis.set(`active:${socketIdA}`, data, 'EX', 7200);
  await redis.set(`active:${socketIdB}`, dataB, 'EX', 7200);
};

export const getActiveSession = async (socketId: string) => {
  const data = await redis.get(`active:${socketId}`);
  return data ? JSON.parse(data) : null;
};

export const clearActiveSession = async (socketIdA: string, socketIdB: string) => {
  await redis.del(`active:${socketIdA}`);
  await redis.del(`active:${socketIdB}`);
};

export const setLastSkipped = async (userId: string, matchedSocketId: string) => {
  await redis.set(`rewind:${userId}`, matchedSocketId, 'EX', 3600);
};

export const getLastSkipped = async (userId: string) => {
  return redis.get(`rewind:${userId}`);
};
