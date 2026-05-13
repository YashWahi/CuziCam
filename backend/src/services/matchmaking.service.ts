import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';

export interface QueueEntry {
  userId: string;
  socketId: string;
  collegeId: string;
  collegeName: string;
  name: string;
  interests: string[];
  gender: 'male' | 'female';
  joinedAt: number;
}

const queueKey = (gender: 'male' | 'female') => `queue:${gender}`;
const CHAOS_START_KEY = 'chaos:start';
const CHAOS_DURATION_MS = 2 * 60 * 60 * 1000;

export const computeMatchScore = (a: QueueEntry, b: QueueEntry): number => {
  const shared = a.interests.filter((interest) => b.interests.includes(interest)).length;
  return shared * 10 + (a.collegeId && a.collegeId === b.collegeId ? 20 : 0);
};

export const getChaosWindowStatus = async () => {
  const rawStart = await redis.get(CHAOS_START_KEY);
  const chaosStart = rawStart ? Number(rawStart) : null;
  const chaosEnd = chaosStart ? chaosStart + CHAOS_DURATION_MS : null;
  const now = Date.now();

  return {
    isChaosWindow: Boolean(chaosStart && chaosEnd && now >= chaosStart && now < chaosEnd),
    chaosStart,
    chaosEnd,
  };
};

export const isChaosWindowActive = async (): Promise<boolean> => {
  return (await getChaosWindowStatus()).isChaosWindow;
};

export const setChaosStart = async (start: number): Promise<void> => {
  await redis.set(CHAOS_START_KEY, String(start));
};

export const enqueue = async (entry: QueueEntry): Promise<void> => {
  await redis.zadd(queueKey(entry.gender), entry.joinedAt, JSON.stringify(entry));
  await redis.set(`session:${entry.socketId}`, JSON.stringify(entry), 'EX', 3600);
};

export const dequeue = async (socketId: string): Promise<void> => {
  const sessionData = await redis.get(`session:${socketId}`);
  if (!sessionData) return;
  const entry = JSON.parse(sessionData) as QueueEntry;
  await redis.multi()
    .zrem(queueKey(entry.gender), sessionData)
    .del(`session:${socketId}`)
    .exec();
};

const loadQueueEntries = async (entry: QueueEntry): Promise<QueueEntry[]> => {
  const chaosActive = await isChaosWindowActive();
  const keys = chaosActive ? [queueKey('male'), queueKey('female')] : [queueKey(entry.gender)];
  const rawLists = await Promise.all(keys.map((key) => redis.zrange(key, 0, -1)));

  return rawLists
    .flat()
    .map((raw) => JSON.parse(raw) as QueueEntry)
    .filter((candidate) => candidate.userId !== entry.userId && candidate.socketId !== entry.socketId);
};

export const findBestMatch = async (entry: QueueEntry): Promise<QueueEntry | null> => {
  const candidates = await loadQueueEntries(entry);
  if (candidates.length === 0) return null;

  const blocks = await prisma.block.findMany({
    where: {
      OR: [
        { blockerId: entry.userId, blockedId: { in: candidates.map((c) => c.userId) } },
        { blockedId: entry.userId, blockerId: { in: candidates.map((c) => c.userId) } },
      ],
    },
    select: { blockerId: true, blockedId: true },
  });

  const blockedUserIds = new Set(
    blocks.map((block) => block.blockerId === entry.userId ? block.blockedId : block.blockerId)
  );

  let best: QueueEntry | null = null;
  let bestScore = -1;

  for (const candidate of candidates) {
    if (blockedUserIds.has(candidate.userId)) continue;
    const score = computeMatchScore(entry, candidate);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
};

export const removeMatchedPair = async (a: QueueEntry, b: QueueEntry) => {
  await redis.multi()
    .zrem(queueKey(a.gender), JSON.stringify(a))
    .zrem(queueKey(b.gender), JSON.stringify(b))
    .del(`session:${a.socketId}`)
    .del(`session:${b.socketId}`)
    .exec();
};

export const setActiveSession = async (
  socketIdA: string,
  socketIdB: string,
  userIdA: string,
  userIdB: string,
  sessionId: string,
) => {
  await redis.multi()
    .set(`active:${socketIdA}`, JSON.stringify({ sessionId, partner: socketIdB, partnerUserId: userIdB }), 'EX', 7200)
    .set(`active:${socketIdB}`, JSON.stringify({ sessionId, partner: socketIdA, partnerUserId: userIdA }), 'EX', 7200)
    .set(`active-user:${userIdA}`, socketIdA, 'EX', 7200)
    .set(`active-user:${userIdB}`, socketIdB, 'EX', 7200)
    .exec();
};

export const getActiveSession = async (socketId: string) => {
  const data = await redis.get(`active:${socketId}`);
  return data ? JSON.parse(data) : null;
};

export const clearActiveSession = async (socketIdA: string, socketIdB: string) => {
  const [sessionA, sessionB] = await Promise.all([getActiveSession(socketIdA), getActiveSession(socketIdB)]);
  await redis.multi()
    .del(`active:${socketIdA}`)
    .del(`active:${socketIdB}`)
    .del(sessionA?.partnerUserId ? `active-user:${sessionA.partnerUserId}` : 'noop:a')
    .del(sessionB?.partnerUserId ? `active-user:${sessionB.partnerUserId}` : 'noop:b')
    .exec();
};

export const getSocketForUser = async (userId: string) => redis.get(`active-user:${userId}`);
