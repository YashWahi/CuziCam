import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const createConfession = async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    const userId = req.user?.userId;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { collegeId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const confession = await prisma.confession.create({
      data: {
        content,
        collegeId: user.collegeId,
        authorId: userId, // Track for moderation, but keep anonymous on front-end
      }
    });

    res.status(201).json(confession);
  } catch (error) {
    console.error('[Confessions] Create error:', error);
    res.status(500).json({ error: 'Failed to create confession' });
  }
};

export const getConfessionsByCollege = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { collegeId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const confessions = await prisma.confession.findMany({
      where: {
        collegeId: user.collegeId,
        isVisible: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    res.json(confessions);
  } catch (error) {
    console.error('[Confessions] Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch confessions' });
  }
};

export const upvoteConfession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const confession = await prisma.confession.update({
      where: { id },
      data: {
        upvotes: { increment: 1 }
      }
    });
    res.json(confession);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upvote' });
  }
};
