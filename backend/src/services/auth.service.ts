import { prisma } from '../lib/prisma';
import { signToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Known India college domains (MVP mock list)
const KNOWN_EDU_DOMAINS = [
  'iit.ac.in', 'bits-pilani.ac.in', 'nit.ac.in', 'vit.ac.in', 'manipal.edu',
  'srm.edu.in', 'amity.edu', 'du.ac.in', 'mu.ac.in', 'mit.edu', 'stanford.edu',
  'harvard.edu', 'cam.ac.uk', 'iim.ac.in', 'iisc.ac.in',
];

export const isValidEduEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  // Check exact match or subdomain match
  return KNOWN_EDU_DOMAINS.some(
    (d) => domain === d || domain.endsWith(`.${d}`)
  );
};

export const registerWithEmail = async (data: {
  email: string;
  password: string;
  name: string;
  collegeId: string;
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
  const emailVerifyToken = crypto.randomBytes(32).toString('hex');

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      emailVerifyToken,
      collegeId: data.collegeId,
      year: data.year,
      branch: data.branch,
      interests: data.interests || [],
    },
  });

  // TODO: send verification email
  return { user, emailVerifyToken };
};

export const loginWithEmail = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) throw new Error('Invalid credentials.');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('Invalid credentials.');

  if (user.isBanned) throw new Error('Account suspended. Contact support.');

  const payload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = signToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken, lastSeen: new Date() },
  });

  return { accessToken, refreshToken, user };
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

export const verifyEmail = async (token: string) => {
  const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
  if (!user) throw new Error('Invalid or expired verification link.');

  await prisma.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true, emailVerifyToken: null },
  });

  return user;
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
    // Auto-detect college from domain
    const domain = data.email.split('@')[1];
    let college = await prisma.college.findUnique({ where: { domain } });

    if (!college && data.collegeId) {
      college = await prisma.college.findUnique({ where: { id: data.collegeId } });
    }

    if (!college) {
      // Create a placeholder college entry
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
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId: data.googleId, avatarUrl: data.avatarUrl },
    });
  }

  if (user.isBanned) throw new Error('Account suspended. Contact support.');

  const payload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = signToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken, lastSeen: new Date() },
  });

  return { accessToken, refreshToken, user };
};
