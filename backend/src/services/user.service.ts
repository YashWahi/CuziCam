import { prisma } from '../lib/prisma';

export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      bio: true,
      year: true,
      branch: true,
      interests: true,
      gender: true,
      vibeScore: true,
      isVerified: true,
      college: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  
  if (!user) throw new Error('User not found.');

  return {
    ...user,
    interests: user.interests ? JSON.parse(user.interests) : [],
  };
};

export const updateProfile = async (userId: string, data: {
  name?: string;
  bio?: string;
  year?: string;
  branch?: string;
  interests?: string[];
  gender?: string;
  avatarUrl?: string;
}) => {
  const updateData: any = { ...data };
  if (data.interests) {
    updateData.interests = JSON.stringify(data.interests);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return {
    ...user,
    interests: user.interests ? JSON.parse(user.interests) : [],
  };
};

export const getConnections = async (userId: string) => {
  const connections = await prisma.connection.findMany({
    where: {
      OR: [
        { userAId: userId },
        { userBId: userId },
      ],
    },
    include: {
      userA: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          college: { select: { name: true } },
        },
      },
      userB: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          college: { select: { name: true } },
        },
      },
    },
  });

  return connections.map(conn => {
    const otherUser = conn.userAId === userId ? conn.userB : conn.userA;
    return {
      id: conn.id,
      userId: otherUser.id,
      name: otherUser.name,
      avatarUrl: otherUser.avatarUrl,
      college: otherUser.college?.name || 'Unknown',
      connectedAt: conn.createdAt,
    };
  });
};

export const getLeaderboard = async () => {
  return prisma.user.findMany({
    orderBy: { vibeScore: 'desc' },
    take: 20,
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      vibeScore: true,
      college: { select: { name: true } },
    },
  });
};

export const onboarding = async (userId: string, data: {
  collegeId: string;
  year?: string;
  branch?: string;
  interests: string[];
  bio?: string;
}) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      collegeId: data.collegeId,
      year: data.year,
      branch: data.branch,
      interests: JSON.stringify(data.interests),
      bio: data.bio,
    },
  });

  return {
    ...user,
    interests: user.interests ? JSON.parse(user.interests) : [],
  };
};
