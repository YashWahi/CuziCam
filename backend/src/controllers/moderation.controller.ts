import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getAllReports = async (req: Request, res: Response) => {
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

export const banUser = async (req: Request, res: Response) => {
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

export const getModerationStats = async (req: Request, res: Response) => {
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
