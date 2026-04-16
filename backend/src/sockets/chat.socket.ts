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
import { redis } from '../lib/redis';
import { verifyToken } from '../lib/jwt';
import aiService from '../services/ai.service';

const socketUserMap = new Map<string, string>();

export const registerSocketHandlers = (io: Server) => {
  io.on('connection', async (socket: Socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    socket.on('authenticate', async (token: string) => {
      try {
        const decoded = verifyToken(token);
        if (!decoded) throw new Error('Invalid token');
        
        socketUserMap.set(socket.id, decoded.userId);
        
        await prisma.user.update({
          where: { id: decoded.userId },
          data: { lastSeen: new Date() }
        });

        socket.emit('auth:success', { userId: decoded.userId });
      } catch {
        socket.emit('auth:error', 'Invalid token');
      }
    });

    // ─── MATCHMAKING (Audit: 5s Retry Loop) ───────────────────
    socket.on('match:join', async (data: { mode: string, preferences: any }) => {
      const userId = socketUserMap.get(socket.id);
      if (!userId) return socket.emit('error', 'Not authenticated');

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return;

      const entry: QueueEntry = {
        userId: user.id,
        socketId: socket.id,
        collegeId: user.collegeId || '',
        interests: user.interests ? JSON.parse(user.interests) : [],
        year: user.year || undefined,
        vibeScore: user.vibeScore,
        gender: user.gender || undefined,
        mode: data.mode || 'random',
        filters: data.preferences || {},
        joinedAt: Date.now(),
      };

      const startMatching = async () => {
        // Double check if socket is still in queue
        const stillInQueue = await redis.get(`session:${socket.id}`);
        if (!stillInQueue) return;

        const match = await findBestMatch(entry);
        if (match) {
          await dequeue(match.socketId);
          await dequeue(socket.id);

          const chaosActive = await isChaosWindowActive();
          const session = await prisma.matchSession.create({
            data: {
              userAId: userId,
              userBId: match.userId,
              chaosWindow: chaosActive,
            },
          });

          const sharedInterests = entry.interests.filter((i: string) => match.interests.includes(i));
          const icebreaker = await aiService.getIcebreaker(entry.interests, match.interests);

          await setActiveSession(socket.id, match.socketId, session.id);

          const matchData = {
            sessionId: session.id,
            partnerId: match.userId,
            sharedInterests,
            icebreaker,
            chaosActive
          };

          socket.emit('match:found', { ...matchData, role: 'caller' });
          io.to(match.socketId).emit('match:found', { ...matchData, role: 'receiver' });
        } else {
          // Audit: Retry every 5 seconds
          setTimeout(startMatching, 5000);
        }
      };

      await enqueue(entry);
      socket.emit('match:searching');
      await startMatching();
    });

    socket.on('match:cancel', async () => {
      await dequeue(socket.id);
      socket.emit('match:cancelled');
    });

    // ─── WEBRTC SIGNALING (Audit: Partner Relay Validation) ──
    socket.on('signal:offer', async (data: any) => {
      const session = await getActiveSession(socket.id);
      if (session && io.sockets.adapter.rooms.has(session.partner)) {
        io.to(session.partner).emit('signal:offer', data);
      }
    });

    socket.on('signal:answer', async (data: any) => {
      const session = await getActiveSession(socket.id);
      if (session && io.sockets.adapter.rooms.has(session.partner)) {
        io.to(session.partner).emit('signal:answer', data);
      }
    });

    socket.on('signal:ice', async (data: any) => {
      const session = await getActiveSession(socket.id);
      if (session && io.sockets.adapter.rooms.has(session.partner)) {
        io.to(session.partner).emit('signal:ice', data);
      }
    });

    // ─── CHAT (Audit: Relaying Blocking) ──────────────────────
    socket.on('chat:message', async (data: { text: string }) => {
      const session = await getActiveSession(socket.id);
      if (!session) return;

      const toxicityScore = await aiService.checkToxicity(data.text);
      if (toxicityScore > 0.8) {
        return socket.emit('chat:blocked', { reason: 'Toxic content detected' });
      }

      if (io.sockets.adapter.rooms.has(session.partner)) {
        io.to(session.partner).emit('chat:message', {
          text: data.text,
          userId: socketUserMap.get(socket.id),
          timestamp: Date.now()
        });
      }
    });

    // ─── SESSION END (Audit: Summary & vibeScore) ─────────────
    socket.on('session:end', async () => {
      const session = await getActiveSession(socket.id);
      if (!session) return;

      const dbSession = await prisma.matchSession.update({
        where: { id: session.sessionId },
        data: { endTime: new Date() }
      });

      // Calculate Duration and Reward
      const durationMs = new Date().getTime() - new Date(dbSession.startTime).getTime();
      const durationMins = Math.floor(durationMs / 60000);
      const vibeGain = Math.min(5, Math.max(1, Math.floor(durationMins / 2))); // 1-5 points

      await prisma.user.updateMany({
        where: { id: { in: [dbSession.userAId, dbSession.userBId] } },
        data: { vibeScore: { increment: vibeGain } }
      });

      const summary = {
        durationMins,
        vibeGain,
        endedBy: socketUserMap.get(socket.id)
      };

      socket.emit('session:summary', summary);
      io.to(session.partner).emit('session:summary', summary);
      
      await clearActiveSession(socket.id, session.partner);
    });

    // ─── STAR SYSTEM (Audit: Mutual detection & Connection) ──
    socket.on('session:star', async () => {
      const session = await getActiveSession(socket.id);
      const userId = socketUserMap.get(socket.id);
      if (!session || !userId) return;

      const starKey = `stars:${session.sessionId}:${userId}`;
      await redis.set(starKey, 'true', 'EX', 3600);

      const partnerUserId = socketUserMap.get(session.partner);
      if (!partnerUserId) return;

      const partnerStarKey = `stars:${session.sessionId}:${partnerUserId}`;
      const partnerStarred = await redis.get(partnerStarKey);

      if (partnerStarred) {
        // Mutual Star! Create Connection in DB
        try {
          await prisma.connection.create({
            data: {
              userAId: userId < partnerUserId ? userId : partnerUserId,
              userBId: userId < partnerUserId ? partnerUserId : userId,
              sessionId: session.sessionId
            }
          });
          
          socket.emit('star:mutual');
          io.to(session.partner).emit('star:mutual');
        } catch (e) {
          // Connection likely exists
        }
      } else {
        socket.emit('star:sent');
      }
    });

    socket.on('disconnect', async () => {
      const userId = socketUserMap.get(socket.id);
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { lastSeen: new Date() }
        });
      }
      await dequeue(socket.id);
      
      // Notify partner of disconnect if in session
      const session = await getActiveSession(socket.id);
      if (session) {
        io.to(session.partner).emit('session:partner-disconnected');
        await clearActiveSession(socket.id, session.partner);
      }

      socketUserMap.delete(socket.id);
    });
  });
};
