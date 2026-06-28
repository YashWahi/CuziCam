import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import aiService from '../services/ai.service';

export const getConfessionsByCollege = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { sort = 'trending', page = '1', limit = '20' } = req.query;
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(limit) || 20));
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.collegeId) return res.status(403).json({ error: 'Please set your college first.' });

    let confessions = await prisma.confession.findMany({
      where: { collegeId: user.collegeId, isVisible: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        college: { select: { name: true } },
        author: { select: { name: true, avatarUrl: true } }
      }
    });

    if (sort === 'trending') {
      confessions = confessions.sort((a, b) => {
        const ageA = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 3600);
        const ageB = (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 3600);
        const scoreA = a.upvotes / Math.pow(ageA + 2, 1.5);
        const scoreB = b.upvotes / Math.pow(ageB + 2, 1.5);
        return scoreB - scoreA;
      });
    }

    const start = (pageNumber - 1) * pageSize;
    res.json({
      items: confessions.slice(start, start + pageSize),
      page: pageNumber,
      hasMore: start + pageSize < confessions.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createConfession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { content, isAnonymous } = req.body;
    const sanitizedContent = content
      .replace(/https?:\/\/\S+/gi, '')
      .replace(/www\.\S+/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
    if (!sanitizedContent) return res.status(400).json({ error: 'Content is required' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.collegeId) return res.status(404).json({ error: 'User or college not found' });

    const moderation = await aiService.checkToxicity(sanitizedContent);

    const confession = await prisma.confession.create({
      data: {
        content: sanitizedContent,
        collegeId: user.collegeId, // Explicitly attached from profile
        authorId: isAnonymous ? null : userId,
        toxicScore: moderation.confidence,
        isVisible: !moderation.isToxic,
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

    const existing = await prisma.confessionUpvote.findUnique({
      where: { confessionId_userId: { confessionId: id, userId } },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.confessionUpvote.delete({ where: { id: existing.id } }),
        prisma.confession.update({ where: { id }, data: { upvotes: { decrement: 1 } } }),
      ]);
      const confession = await prisma.confession.findUnique({ where: { id } });
      return res.json({ ...confession, upvoted: false });
    }

    await prisma.$transaction([
      prisma.confessionUpvote.create({ data: { confessionId: id, userId } }),
      prisma.confession.update({ where: { id }, data: { upvotes: { increment: 1 } } }),
    ]);
    const confession = await prisma.confession.findUnique({ where: { id } });

    res.json({ ...confession, upvoted: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
