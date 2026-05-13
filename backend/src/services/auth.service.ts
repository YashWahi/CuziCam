import { prisma } from '../lib/prisma';
import { signToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { redis } from '../lib/redis';
import emailService from './email.service';

export const isValidEduEmail = async (email: string): Promise<boolean> => {
  return email.toLowerCase().endsWith('.edu');
};

const getOrCreateCollege = async (email: string, collegeName: string) => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) throw new Error('Invalid email domain.');

  return prisma.college.upsert({
    where: { domain },
    update: { name: collegeName },
    create: { name: collegeName, domain },
  });
};

export const publicUser = (user: any) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  gender: user.gender,
  role: user.role,
  collegeId: user.collegeId,
  college: user.college ? { id: user.college.id, name: user.college.name, domain: user.college.domain } : null,
  interests: user.interests ? JSON.parse(user.interests) : [],
  onboardingComplete: user.onboardingComplete,
  isVerified: user.isVerified,
  isEmailVerified: user.isEmailVerified,
  vibeScore: user.vibeScore,
});

export const registerWithEmail = async (data: {
  email: string;
  password: string;
  name: string;
  gender: 'male' | 'female';
  college: string;
}) => {
  if (!(await isValidEduEmail(data.email))) {
    throw new Error('Please use a valid .edu college email address.');
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error('Email already registered.');

  const passwordHash = await bcrypt.hash(data.password, 12);
  const college = await getOrCreateCollege(data.email, data.college);
  
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      gender: data.gender,
      collegeId: college.id,
      interests: JSON.stringify([]),
    },
    include: { college: true },
  });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redis.set(`otp:${user.id}`, otp, 'EX', 600); // 10 mins

  await emailService.sendOTP(data.email, otp);

  return { user };
};

export const verifyOTP = async (userId: string, otp: string) => {
  const cached = await redis.get(`otp:${userId}`);
  if (!cached || cached !== otp) throw new Error('Invalid or expired OTP.');

  const user = await prisma.user.update({
    where: { id: userId },
    data: { 
      isEmailVerified: true,
      isVerified: true 
    },
    include: { college: true },
  });

  await redis.del(`otp:${userId}`);

  return user;
};

export const loginWithEmail = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email }, include: { college: true } });
  if (!user || !user.passwordHash) throw new Error('Invalid credentials.');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('Invalid credentials.');

  if (user.isBanned) throw new Error('Account suspended.');
  if (!user.isEmailVerified) throw new Error('Email not verified.');

  const payload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = signToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken, lastSeen: new Date() },
  });

  return { accessToken, refreshToken, user: publicUser(user) };
};

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // Silent fail for security

  const resetToken = crypto.randomBytes(32).toString('hex');
  await redis.set(`reset:${resetToken}`, user.id, 'EX', 3600); // 1 hour

  await emailService.sendPasswordReset(email, resetToken);
};

export const refreshTokens = async (token: string) => {
  const decoded = verifyRefreshToken(token);
  const user = await prisma.user.findUnique({ where: { id: decoded.userId }, include: { college: true } });

  if (!user || user.isBanned || user.refreshToken !== token)
    throw new Error('Invalid refresh token.');

  const payload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = signToken(payload);
  const newRefreshToken = signRefreshToken(payload);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: newRefreshToken, lastSeen: new Date() },
  });

  return { accessToken, refreshToken: newRefreshToken, user: publicUser(user) };
};

export const googleOAuthLogin = async (data: {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  collegeId?: string;
}) => {
  if (!(await isValidEduEmail(data.email))) {
    throw new Error('Please use a valid .edu college email address.');
  }

  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: data.googleId }, { email: data.email }] },
  });

  if (!user) {
    const domain = data.email.split('@')[1];
    let college = await prisma.college.findUnique({ where: { domain } });

    if (!college) {
      college = await prisma.college.create({
        data: { name: domain, domain },
      });
    }

    user = await prisma.user.create({
      data: {
        googleId: data.googleId,
        email: data.email,
        name: data.name,
        avatarUrl: data.avatarUrl,
        collegeId: college.id,
        isEmailVerified: true,
      },
    });
  }

  const payload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = signToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken, lastSeen: new Date() },
  });

  return { accessToken, refreshToken, user };
};

export const resendOTP = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found.');
  if (user.isEmailVerified) throw new Error('Email already verified.');

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redis.set(`otp:${user.id}`, otp, 'EX', 600); // 10 mins

  await emailService.sendOTP(user.email, otp);
  return true;
};
