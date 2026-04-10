import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { college: { select: { name: true } } }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      year: user.year,
      branch: user.branch,
      interests: user.interests,
      vibeScore: user.vibeScore,
      college: user.college.name,
      isVerified: user.isVerified
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, bio, year, branch, interests, avatarUrl, gender, strictPreference } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        bio,
        year,
        branch,
        interests: interests as any,
        avatarUrl,
        gender,
        strictPreference
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        interests: updatedUser.interests
      }
    });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update profile' });
  }
};

export const getConnections = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId }
        ]
      },
      include: {
        userA: { select: { id: true, name: true, avatarUrl: true, branch: true } },
        userB: { select: { id: true, name: true, avatarUrl: true, branch: true } }
      }
    });

    const friends = connections.map(c => 
      c.userAId === userId ? c.userB : c.userA
    );

    res.json(friends);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch connections' });
  }
};
