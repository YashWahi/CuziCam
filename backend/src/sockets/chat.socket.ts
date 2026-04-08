import { Server, Socket } from 'socket.io';
import { prisma } from '../lib/prisma';
import {
  enqueue,
  dequeue,
  findBestMatch,
  setActiveSession,
  getActiveSession,
  clearActiveSession,
  setLastSkipped,
  isChaosWindowActive,
  QueueEntry,
} from '../services/matchmaking.service';
import { verifyToken } from '../lib/jwt';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Track socketId → userId for quick lookups
const socketUserMap = new Map<string, string>();

// Fetch icebreaker from AI service (with fallback)
const getIcebreaker = async (interestsA: string[], interestsB: string[]): Promise<string> => {
  try {
    const res = await axios.post(`${AI_SERVICE_URL}/icebreaker`, {
      interests_a: interestsA,
      interests_b: interestsB,
    }, { timeout: 2000 });
    return res.data.icebreaker || "What's your favorite thing about your college?";
  } catch {
    return "What's your favorite thing about your college?";
  }
};

// Check message toxicity
const checkToxicity = async (message: string): Promise<number> => {
  try {
    const res = await axios.post(`${AI_SERVICE_URL}/toxicity`, { text: message }, { timeout: 1500 });
    return res.data.score || 0;
  } catch {
    return 0;
  }
};

export const registerSocketHandlers = (io: Server) => {
  io.on('connection', async (socket: Socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ─── AUTHENTICATE ─────────────────────────────────────────
    socket.on('authenticate', async (token: string) => {
      try {
        const decoded = verifyToken(token);
        socketUserMap.set(socket.id, decoded.userId);
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: { college: true },
        });
        if (!user) { socket.emit('auth:error', 'User not found'); return; }
        if (user.isBanned) { socket.emit('auth:error', 'Account suspended'); return; }

        socket.emit('auth:success', { userId: user.id, name: user.name });
        console.log(`[Socket] Authenticated: ${user.name} (${socket.id})`);
      } catch {
        socket.emit('auth:error', 'Invalid token');
      }
    });

    // ─── JOIN QUEUE ────────────────────────────────────────────
    socket.on('queue:join', async (filters: QueueEntry['filters']) => {
      const userId = socketUserMap.get(socket.id);
      if (!userId) { socket.emit('error', 'Not authenticated'); return; }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { college: true },
      });
      if (!user) return;

      const entry: QueueEntry = {
        userId: user.id,
        socketId: socket.id,
        collegeId: user.collegeId,
        interests: user.interests,
        vibeScore: user.vibeScore,
        gender: user.gender ?? undefined,
        filters: filters || {},
        joinedAt: Date.now(),
      };

      // Try to find a match immediately
      const match = await findBestMatch(entry);

      if (match) {
        // Remove match from queue
        await dequeue(match.socketId);

        // Create session in DB
        const chaosActive = await isChaosWindowActive();
        const session = await prisma.matchSession.create({
          data: {
            userAId: userId,
            userBId: match.userId,
            chaosWindow: chaosActive,
          },
        });

        // Build vibe check data
        const sharedInterests = entry.interests.filter((i) => match.interests.includes(i));
        const icebreaker = await getIcebreaker(entry.interests, match.interests);

        // Store active sessions
        await setActiveSession(socket.id, match.socketId, session.id);

        // Notify both users
        const vibeCheckData = {
          sessionId: session.id,
          sharedInterests,
          icebreaker,
          chaosWindow: chaosActive,
        };

        socket.emit('match:found', { ...vibeCheckData, role: 'caller' });
        io.to(match.socketId).emit('match:found', { ...vibeCheckData, role: 'receiver' });

        console.log(`[Match] ${userId} ↔ ${match.userId} | Session: ${session.id}`);
      } else {
        // No match, add to queue
        await enqueue(entry);
        socket.emit('queue:waiting', { message: 'Looking for your match...' });
      }
    });

    // ─── LEAVE QUEUE ──────────────────────────────────────────
    socket.on('queue:leave', async () => {
      await dequeue(socket.id);
      socket.emit('queue:left');
    });

    // ─── WEBRTC SIGNALING ─────────────────────────────────────
    socket.on('webrtc:offer', async (data: { sdp: RTCSessionDescriptionInit }) => {
      const session = await getActiveSession(socket.id);
      if (!session) return;
      io.to(session.partner).emit('webrtc:offer', { sdp: data.sdp, from: socket.id });
    });

    socket.on('webrtc:answer', async (data: { sdp: RTCSessionDescriptionInit }) => {
      const session = await getActiveSession(socket.id);
      if (!session) return;
      io.to(session.partner).emit('webrtc:answer', { sdp: data.sdp });
    });

    socket.on('webrtc:ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
      const session = await getActiveSession(socket.id);
      if (!session) return;
      io.to(session.partner).emit('webrtc:ice-candidate', { candidate: data.candidate });
    });

    // ─── TEXT CHAT ─────────────────────────────────────────────
    socket.on('chat:message', async (data: { text: string }) => {
      const session = await getActiveSession(socket.id);
      if (!session) return;

      const toxicityScore = await checkToxicity(data.text);

      // Log to DB for moderation (metadata only)
      if (session.sessionId) {
        await prisma.matchSession.update({
          where: { id: session.sessionId },
          data: { messageCount: { increment: 1 } },
        });
      }

      // If highly toxic, soft-block the message
      if (toxicityScore > 0.85) {
        socket.emit('chat:blocked', { reason: 'Message flagged by AI moderation.' });
        return;
      }

      // Forward message to partner
      io.to(session.partner).emit('chat:message', {
        text: data.text,
        timestamp: Date.now(),
        toxicityScore,
      });
    });

    // ─── SKIP / NEXT ──────────────────────────────────────────
    socket.on('session:skip', async () => {
      const session = await getActiveSession(socket.id);
      if (!session) { await dequeue(socket.id); return; }

      const userId = socketUserMap.get(socket.id);
      const partnerUserId = socketUserMap.get(session.partner);

      // Track last skipped for Rewind feature
      if (userId && partnerUserId) {
        await setLastSkipped(userId, session.partner);
      }

      // End session in DB
      if (session.sessionId) {
        await prisma.matchSession.update({
          where: { id: session.sessionId },
          data: {
            endTime: new Date(),
            skipReason: 'user_skipped',
          },
        });
      }

      // Notify partner they were skipped
      io.to(session.partner).emit('session:partner-skipped');

      // Clear sessions
      await clearActiveSession(socket.id, session.partner);
    });

    // ─── REVEAL MODE ──────────────────────────────────────────
    socket.on('reveal:request', async () => {
      const session = await getActiveSession(socket.id);
      if (!session) return;
      io.to(session.partner).emit('reveal:request');
    });

    socket.on('reveal:accept', async () => {
      const session = await getActiveSession(socket.id);
      if (!session) return;

      const userId = socketUserMap.get(socket.id);
      const partnerUserId = socketUserMap.get(session.partner);

      if (!userId || !partnerUserId) return;

      const [userA, userB] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, avatarUrl: true, branch: true, year: true } }),
        prisma.user.findUnique({ where: { id: partnerUserId }, select: { id: true, name: true, avatarUrl: true, branch: true, year: true } }),
      ]);

      socket.emit('reveal:revealed', { user: userB });
      io.to(session.partner).emit('reveal:revealed', { user: userA });
    });

    // ─── STAR SYSTEM ──────────────────────────────────────────
    socket.on('session:star', async () => {
      const session = await getActiveSession(socket.id);
      const userId = socketUserMap.get(socket.id);
      if (!session || !userId) return;

      const partnerUserId = socketUserMap.get(session.partner);
      if (!partnerUserId) return;

      // Create star record
      try {
        await prisma.star.create({
          data: {
            sessionId: session.sessionId,
            giverId: userId,
            receiverId: partnerUserId,
          },
        });
      } catch { /* Already starred */ return; }

      // Check if mutual star
      const mutualStar = await prisma.star.findFirst({
        where: { sessionId: session.sessionId, giverId: partnerUserId, receiverId: userId },
      });

      if (mutualStar) {
        // Create friend connection
        await prisma.connection.upsert({
          where: { userAId_userBId: { userAId: userId, userBId: partnerUserId } },
          create: { userAId: userId, userBId: partnerUserId, sessionId: session.sessionId },
          update: {},
        });

        socket.emit('star:mutual', { message: "You both loved this conversation ❤️" });
        io.to(session.partner).emit('star:mutual', { message: "You both loved this conversation ❤️" });
      } else {
        socket.emit('star:sent');
      }
    });

    // ─── REPORT ───────────────────────────────────────────────
    socket.on('user:report', async (data: { reason: string; description?: string }) => {
      const session = await getActiveSession(socket.id);
      const userId = socketUserMap.get(socket.id);
      if (!session || !userId) return;

      const partnerUserId = socketUserMap.get(session.partner);
      if (!partnerUserId) return;

      // Validate reason is a valid ReportReason enum value
      const validReasons = [
        'INAPPROPRIATE_CONTENT', 'HARASSMENT', 'SPAM', 'NUDITY', 'UNDERAGE', 'OTHER'
      ];
      const reason = validReasons.includes(data.reason) ? data.reason : 'OTHER';

      await prisma.report.create({
        data: {
          reporterId: userId,
          reportedId: partnerUserId,
          sessionId: session.sessionId,
          reason: reason as any,
          description: data.description,
        },
      });

      socket.emit('report:submitted');
    });

    // ─── DISCONNECT ───────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);

      // Clean up queue
      await dequeue(socket.id);

      // Clean up active session
      const session = await getActiveSession(socket.id);
      if (session) {
        await clearActiveSession(socket.id, session.partner);
        if (session.sessionId) {
          await prisma.matchSession.update({
            where: { id: session.sessionId },
            data: { endTime: new Date() },
          });
        }
        io.to(session.partner).emit('session:partner-disconnected');
      }

      socketUserMap.delete(socket.id);
    });
  });
};
