import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as userService from '../services/user.service';
import { prisma } from '../lib/prisma';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const profile = await userService.getUserProfile(userId);
    res.json(profile);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const getMe = getProfile;

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const profile = await userService.updateProfile(userId, req.body);
    res.json(profile);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const blockUser = async (req: AuthRequest, res: Response) => {
  try {
    const blockerId = req.user?.userId;
    const { blockedId } = req.body;
    if (!blockerId) return res.status(401).json({ error: 'Unauthorized' });
    if (blockerId === blockedId) return res.status(400).json({ error: 'Cannot block yourself' });

    await prisma.$transaction([
      prisma.block.upsert({
        where: { blockerId_blockedId: { blockerId, blockedId } },
        update: {},
        create: { blockerId, blockedId },
      }),
      prisma.block.upsert({
        where: { blockerId_blockedId: { blockerId: blockedId, blockedId: blockerId } },
        update: {},
        create: { blockerId: blockedId, blockedId: blockerId },
      }),
    ]);

    res.status(201).json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getBlocks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const blocks = await prisma.block.findMany({
      where: { blockerId: userId },
      select: { blockedId: true },
    });
    res.json(blocks.map((block) => block.blockedId));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const reportUser = async (req: AuthRequest, res: Response) => {
  try {
    const reporterId = req.user?.userId;
    const { reportedId, reason, sessionId } = req.body;
    if (!reporterId) return res.status(401).json({ error: 'Unauthorized' });
    if (reporterId === reportedId) return res.status(400).json({ error: 'Cannot report yourself' });

    // Map lowercase API reason to Prisma enum value
    const reasonMap: Record<string, string> = {
      fake_profile: 'FAKE_PROFILE',
      harassment: 'HARASSMENT',
      inappropriate_content: 'INAPPROPRIATE_CONTENT',
      underage: 'UNDERAGE',
    };
    const enumReason = reasonMap[reason] || reason.toUpperCase();

    const report = await prisma.$transaction(async (tx) => {
      const createdReport = await tx.report.create({
        data: { reporterId, reportedId, reason: enumReason as any, sessionId },
      });

      await tx.block.upsert({
        where: { blockerId_blockedId: { blockerId: reporterId, blockedId: reportedId } },
        update: {},
        create: { blockerId: reporterId, blockedId: reportedId },
      });
      await tx.block.upsert({
        where: { blockerId_blockedId: { blockerId: reportedId, blockedId: reporterId } },
        update: {},
        create: { blockerId: reportedId, blockedId: reporterId },
      });

      return createdReport;
    });

    res.status(201).json(report);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getConnections = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const connections = await userService.getConnections(userId);
    res.json(connections);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const leaderboard = await userService.getLeaderboard();
    res.json(leaderboard);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const onboarding = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await userService.completeOnboarding(userId, req.body);
    res.json({ success: true, user: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const stats = await userService.getUserStats(userId);
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await userService.deleteUser(userId);
    res.status(200).json({ message: 'User account deleted successfully.' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
