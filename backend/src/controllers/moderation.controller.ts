import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

// Moderation Dashboard Controller
// Provides insights into reported users and session metadata.

export const getAllReports = async (req: AuthRequest, res: Response) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        reported: { select: { id: true, name: true, email: true } },
        session: { select: { id: true, startTime: true, messageCount: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

export const banUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.body;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isBanned: true }
    });
    res.json({ message: `User ${user.name} banned successfully.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to ban user' });
  }
};

export const getModerationStats = async (req: AuthRequest, res: Response) => {
  try {
    const [userCount, matchCount, reportCount] = await Promise.all([
      prisma.user.count(),
      prisma.matchSession.count(),
      prisma.report.count({ where: { status: 'PENDING' } })
    ]);

    res.json({
      userCount,
      matchCount,
      pendingReports: reportCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
