import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';

// ──────────────────────────────────────────────────────────────
// Queue key naming convention:
//   queue:main           — general matchmaking pool
//   queue:college:<id>   — college-specific pool
//   session:<socketId>   — active user session data
// ──────────────────────────────────────────────────────────────

export interface QueueEntry {
  userId: string;
  socketId: string;
  collegeId: string;
  interests: string[];
  vibeScore: number;
  gender?: string;
  filters: {
    sameCollege?: boolean;
    sameBranch?: boolean;
    branch?: string;
  };
  joinedAt: number;
}

const MAIN_QUEUE_KEY = 'queue:main';
const CHAOS_WINDOW_KEY = 'chaos:active';

// ─── CHAOS WINDOW ─────────────────────────────────────────────
export const isChaosWindowActive = async (): Promise<boolean> => {
  const val = await redis.get(CHAOS_WINDOW_KEY);
  return val === 'true';
};

export const setChaosWindow = async (active: boolean, ttlSeconds?: number): Promise<void> => {
  if (active && ttlSeconds) {
    await redis.setEx(CHAOS_WINDOW_KEY, ttlSeconds, 'true');
  } else if (active) {
    await redis.set(CHAOS_WINDOW_KEY, 'true');
  } else {
    await redis.del(CHAOS_WINDOW_KEY);
  }
};

// ─── QUEUE MANAGEMENT ─────────────────────────────────────────
export const enqueue = async (entry: QueueEntry): Promise<void> => {
  const key = MAIN_QUEUE_KEY;
  // Store full entry as JSON in a sorted set (score = joinedAt for FIFO)
  await redis.zAdd(key, { score: entry.joinedAt, value: JSON.stringify(entry) });
  // Also store a reverse lookup: socketId → entry
  await redis.set(`session:${entry.socketId}`, JSON.stringify(entry), { EX: 3600 });
};

export const dequeue = async (socketId: string): Promise<void> => {
  const sessionData = await redis.get(`session:${socketId}`);
  if (!sessionData) return;

  await redis.zRem(MAIN_QUEUE_KEY, sessionData);
  await redis.del(`session:${socketId}`);
};

// ─── SCORING & MATCHING ───────────────────────────────────────
const computeMatchScore = (a: QueueEntry, b: QueueEntry, chaosActive: boolean): number => {
  let score = 0;

  // Interest overlap — most important signal
  const sharedInterests = a.interests.filter((i) => b.interests.includes(i));
  score += sharedInterests.length * 20;

  // College match
  if (a.collegeId === b.collegeId && a.filters.sameCollege) score += 15;

  // Branch match
  if (a.filters.branch && a.filters.branch === b.filters.branch) score += 10;

  // Vibe score proximity (closer scores = better match)
  const vibeDiff = Math.abs(a.vibeScore - b.vibeScore);
  score += Math.max(0, 10 - vibeDiff * 2);

  // During chaos window, reduce gender-based filtering effects
  if (chaosActive && !a.filters.sameCollege && !b.filters.sameCollege) {
    score += 5; // slight nudge to ensure chaos window pairings work
  }

  // Penalize high wait time disparity (fairness)
  const waitDiff = Math.abs((Date.now() - a.joinedAt) - (Date.now() - b.joinedAt));
  if (waitDiff > 30000) score -= 5; // penalize if one user waited 30s more

  return score;
};

export const findBestMatch = async (entry: QueueEntry): Promise<QueueEntry | null> => {
  const chaosActive = await isChaosWindowActive();

  // Get all waiting users (up to 200 at a time for efficiency)
  const rawEntries = await redis.zRange(MAIN_QUEUE_KEY, 0, 199, { REV: false });

  let bestMatch: QueueEntry | null = null;
  let bestScore = -Infinity;

  for (const raw of rawEntries) {
    const candidate: QueueEntry = JSON.parse(raw);

    // Don't match with self
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
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  return bestMatch;
};

// ─── SESSION TRACKING ─────────────────────────────────────────
export const setActiveSession = async (
  socketIdA: string,
  socketIdB: string,
  sessionId: string
): Promise<void> => {
  const data = JSON.stringify({ sessionId, partner: socketIdB });
  const dataB = JSON.stringify({ sessionId, partner: socketIdA });
  await redis.set(`active:${socketIdA}`, data, { EX: 7200 });
  await redis.set(`active:${socketIdB}`, dataB, { EX: 7200 });
};

export const getActiveSession = async (socketId: string) => {
  const data = await redis.get(`active:${socketId}`);
  return data ? JSON.parse(data) : null;
};

export const clearActiveSession = async (socketIdA: string, socketIdB: string): Promise<void> => {
  await redis.del(`active:${socketIdA}`);
  await redis.del(`active:${socketIdB}`);
};

// ─── REWIND TRACKING (last skipped user, per user) ────────────
export const setLastSkipped = async (userId: string, matchedSocketId: string): Promise<void> => {
  await redis.set(`rewind:${userId}`, matchedSocketId, { EX: 3600 });
};

export const getLastSkipped = async (userId: string): Promise<string | null> => {
  return redis.get(`rewind:${userId}`);
};
