import { randomUUID } from 'crypto';
import { Server, Socket } from 'socket.io';
import { prisma } from '../lib/prisma';
import {
  clearActiveSession,
  dequeue,
  enqueue,
  findBestMatch,
  getActiveSession,
  isChaosWindowActive,
  QueueEntry,
  removeMatchedPair,
  setActiveSession,
} from '../services/matchmaking.service';
import { verifyToken } from '../lib/jwt';
import aiService from '../services/ai.service';
import { redis } from '../lib/redis';

const socketUserMap = new Map<string, string>();

const relay = async (io: Server, socket: Socket, event: string, data: unknown) => {
  const session = await getActiveSession(socket.id);
  if (session) io.to(session.partner).emit(event, data);
};

export const registerSocketHandlers = (io: Server) => {
  io.on('connection', async (socket: Socket) => {
    socket.on('authenticate', async (token: string) => {
      try {
        const decoded = verifyToken(token);
        socketUserMap.set(socket.id, decoded.userId);
        await prisma.user.update({
          where: { id: decoded.userId },
          data: { lastSeen: new Date() },
        });
        socket.emit('auth:success');
      } catch {
        socket.emit('auth:error', 'Invalid token');
      }
    });

    const joinQueue = async () => {
      const userId = socketUserMap.get(socket.id);
      if (!userId) return socket.emit('error', 'Not authenticated');

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { college: { select: { name: true } } },
      });
      if (!user || user.isBanned || !user.gender || (user.gender !== 'male' && user.gender !== 'female')) {
        return socket.emit('error', 'Profile is not eligible for matchmaking');
      }

      const entry: QueueEntry = {
        userId: user.id,
        socketId: socket.id,
        collegeId: user.collegeId || '',
        collegeName: user.college?.name || 'College',
        name: user.name,
        interests: user.interests || [],
        gender: user.gender,
        joinedAt: Date.now(),
      };

      await enqueue(entry);
      socket.emit('match:searching');

      const tryMatch = async () => {
        const stillQueued = await redis.get(`session:${socket.id}`);
        if (!stillQueued) return;
        const match = await findBestMatch(entry);
        if (!match) {
          setTimeout(tryMatch, 5000);
          return;
        }

        await removeMatchedPair(entry, match);
        const chaosActive = await isChaosWindowActive();
        const sessionId = randomUUID();
        await prisma.matchSession.create({
          data: {
            id: sessionId,
            userAId: entry.userId,
            userBId: match.userId,
            chaosWindow: chaosActive,
          },
        });
        await setActiveSession(socket.id, match.socketId, entry.userId, match.userId, sessionId);

        const sharedInterests = entry.interests.filter((interest) => match.interests.includes(interest));
        const icebreaker = await aiService.getIcebreaker(entry.interests, match.interests);

        socket.emit('match:found', {
          sessionId,
          partnerId: match.userId,
          partnerName: match.name,
          partnerCollege: match.collegeName,
          partnerGender: match.gender,
          sharedInterests,
          icebreaker,
          role: 'caller',
        });
        io.to(match.socketId).emit('match:found', {
          sessionId,
          partnerId: entry.userId,
          partnerName: entry.name,
          partnerCollege: entry.collegeName,
          partnerGender: entry.gender,
          sharedInterests,
          icebreaker,
          role: 'receiver',
        });
      };

      await tryMatch();
    };

    socket.on('join:queue', joinQueue);
    socket.on('match:join', joinQueue);

    socket.on('match:cancel', async () => {
      await dequeue(socket.id);
      socket.emit('match:cancelled');
    });

    socket.on('webrtc:offer', (data) => relay(io, socket, 'webrtc:offer', data));
    socket.on('webrtc:answer', (data) => relay(io, socket, 'webrtc:answer', data));
    socket.on('webrtc:ice-candidate', (data) => relay(io, socket, 'webrtc:ice-candidate', data));
    socket.on('signal:offer', (data) => relay(io, socket, 'signal:offer', data));
    socket.on('signal:answer', (data) => relay(io, socket, 'signal:answer', data));
    socket.on('signal:ice', (data) => relay(io, socket, 'signal:ice', data));

    socket.on('chat:message', async (data: { sessionId?: string; content?: string; text?: string }) => {
      const session = await getActiveSession(socket.id);
      const senderId = socketUserMap.get(socket.id);
      if (!session || !senderId || (data.sessionId && data.sessionId !== session.sessionId)) return;

      const content = String(data.content || data.text || '').trim().slice(0, 1000);
      if (!content) return;

      const moderation = await aiService.checkToxicity(content);
      const displayContent = moderation.isToxic ? '[Message removed]' : content;
      const payload = { sessionId: session.sessionId, content: displayContent, senderId, timestamp: Date.now() };

      socket.emit('chat:message', payload);
      io.to(session.partner).emit('chat:message', payload);
      if (moderation.isToxic) socket.emit('chat:warning', { reason: 'Toxic content detected' });
    });

    socket.on('chat:leave', async () => {
      const session = await getActiveSession(socket.id);
      if (!session) return;
      io.to(session.partner).emit('session:partner-disconnected');
      await clearActiveSession(socket.id, session.partner);
    });

    socket.on('session:end', async () => {
      const session = await getActiveSession(socket.id);
      if (!session) return;
      await prisma.matchSession.update({ where: { id: session.sessionId }, data: { endTime: new Date() } });
      io.to(session.partner).emit('session:partner-disconnected');
      await clearActiveSession(socket.id, session.partner);
    });

    socket.on('disconnect', async () => {
      const userId = socketUserMap.get(socket.id);
      if (userId) {
        await prisma.user.update({ where: { id: userId }, data: { lastSeen: new Date() } }).catch(() => undefined);
      }
      await dequeue(socket.id);
      const session = await getActiveSession(socket.id);
      if (session) {
        io.to(session.partner).emit('session:partner-disconnected');
        await clearActiveSession(socket.id, session.partner);
      }
      socketUserMap.delete(socket.id);
    });
  });
};
