import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

export const getAllReports = async (req: AuthRequest, res: Response) => {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, name: true } },
        reported: { select: { id: true, name: true } },
        session: true
      }
    });
    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const banUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'UserId is required' });

    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: true }
    });

    res.json({ message: `User ${userId} has been banned.` });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getModerationStats = async (req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, totalReports, bannedUsers] = await Promise.all([
      prisma.user.count(),
      prisma.report.count(),
      prisma.user.count({ where: { isBanned: true } })
    ]);

    res.json({
      totalUsers,
      totalReports,
      bannedUsers
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const reporterId = req.user?.userId;
    const { reportedId, sessionId, reason, description } = req.body;

    if (!reporterId) return res.status(401).json({ error: 'Unauthorized' });
    if (!reportedId || !reason) return res.status(400).json({ error: 'ReportedId and reason are required' });

    // Save report
    const report = await prisma.report.create({
      data: {
        reporterId,
        reportedId,
        sessionId,
        reason,
        description,
        status: 'PENDING'
      }
    });

    // Auto-shadowban logic: Check if user has 3+ open reports in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentReportsCount = await prisma.report.count({
      where: {
        reportedId,
        status: 'PENDING',
        createdAt: { gte: twentyFourHoursAgo }
      }
    });

    if (recentReportsCount >= 3) {
      await prisma.user.update({
        where: { id: reportedId },
        data: { shadowBanned: true }
      });
    }

    res.status(201).json(report);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
