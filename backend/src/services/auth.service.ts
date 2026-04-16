import { prisma } from '../lib/prisma';
import { signToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { redis } from '../lib/redis';
import emailService from './email.service';

// Known India college domains
const KNOWN_EDU_DOMAINS = [
  'iit.ac.in', 'bits-pilani.ac.in', 'nit.ac.in', 'vit.ac.in', 'manipal.edu',
  'srm.edu.in', 'amity.edu', 'du.ac.in', 'mu.ac.in', 'mit.edu', 'stanford.edu',
  'harvard.edu', 'cam.ac.uk', 'iim.ac.in', 'iisc.ac.in',
];

export const isValidEduEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return KNOWN_EDU_DOMAINS.some(
    (d) => domain === d || domain.endsWith(`.${d}`)
  );
};

export const registerWithEmail = async (data: {
  email: string;
  password: string;
  name: string;
  collegeId?: string;
  year?: string;
  branch?: string;
  interests?: string[];
}) => {
  if (!isValidEduEmail(data.email)) {
    throw new Error('Please use a valid college email address.');
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error('Email already registered.');

  const passwordHash = await bcrypt.hash(data.password, 12);
  
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      collegeId: data.collegeId,
      year: data.year,
      branch: data.branch,
      interests: JSON.stringify(data.interests || []),
    },
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

  await prisma.user.update({
    where: { id: userId },
    data: { 
      isEmailVerified: true,
      isVerified: true 
    },
  });

  await redis.del(`otp:${userId}`);
  return true;
};

export const loginWithEmail = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
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

  return { accessToken, refreshToken, user };
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
  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

  if (!user || user.refreshToken !== token)
    throw new Error('Invalid refresh token.');

  const payload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = signToken(payload);
  const newRefreshToken = signRefreshToken(payload);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: newRefreshToken, lastSeen: new Date() },
  });

  return { accessToken, refreshToken: newRefreshToken };
};

export const googleOAuthLogin = async (data: {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  collegeId?: string;
}) => {
  if (!isValidEduEmail(data.email)) {
    throw new Error('Please use a valid college email address.');
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
