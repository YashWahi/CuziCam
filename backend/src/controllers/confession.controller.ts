import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import aiService from '../services/ai.service';

export const getConfessionsByCollege = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { sort = 'new' } = req.query;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.collegeId) return res.status(403).json({ error: 'Please set your college first.' });

    let confessions = await prisma.confession.findMany({
      where: { collegeId: user.collegeId, isVisible: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        author: { select: { name: true, avatarUrl: true } }
      }
    });

    if (sort === 'trending') {
      // Trending Algorithm: Score = Upvotes / (AgeInHours + 2)^1.5
      confessions = confessions.sort((a, b) => {
        const ageA = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 3600);
        const ageB = (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 3600);
        const scoreA = (a.upvotes + 1) / Math.pow(ageA + 2, 1.5);
        const scoreB = (b.upvotes + 1) / Math.pow(ageB + 2, 1.5);
        return scoreB - scoreA;
      });
    }

    res.json(confessions.slice(0, 50));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createConfession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.collegeId) return res.status(404).json({ error: 'User or college not found' });

    const toxicScore = await aiService.checkToxicity(content);

    const confession = await prisma.confession.create({
      data: {
        content,
        collegeId: user.collegeId, // Explicitly attached from profile
        authorId: userId,
        toxicScore,
        isVisible: toxicScore < 0.8
      }
    });

    res.status(201).json(confession);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const upvoteConfession = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Anti-double-vote: Check Redis
    const voteKey = `voted:confession:${id}:user:${userId}`;
    const alreadyVoted = await redis.get(voteKey);
    if (alreadyVoted) {
      return res.status(403).json({ error: 'You have already upvoted this confession' });
    }

    const confession = await prisma.confession.update({
      where: { id },
      data: { upvotes: { increment: 1 } }
    });

    // Mark as voted for 24 hours
    await redis.set(voteKey, '1', 'EX', 86400);

    res.json(confession);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
