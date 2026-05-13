import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { prisma } from '../lib/prisma';
import { signToken, signRefreshToken } from '../lib/jwt';
import { publicUser } from '../services/auth.service';

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, gender, college } = req.body;

    const { user } = await authService.registerWithEmail({
      email,
      password,
      name,
      gender,
      college,
    });

    res.status(201).json({
      message: 'Registration successful. OTP sent to your email.',
      userId: user.id
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await authService.loginWithEmail(email, password);

    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      accessToken,
      refreshToken,
      user,
    });
  } catch (error: any) {
    const status = error.cause === 'UNVERIFIED' ? 403 : 401;
    res.status(status).json({ error: error.message, code: error.cause });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { userId, otp } = req.body;
    const user = await authService.verifyOTP(userId, otp);

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = signToken(payload);
    const refreshToken = signRefreshToken(payload);
    setAuthCookies(res, accessToken, refreshToken);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken, lastSeen: new Date() },
    });

    return res.json({
      accessToken,
      refreshToken,
      user: publicUser(user),
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshTokenFromCookie = req.cookies.refreshToken;
    const { refreshToken: refreshTokenFromBody } = req.body;
    
    const token = refreshTokenFromCookie || refreshTokenFromBody;
    if (!token) return res.status(400).json({ error: 'Refresh token required' });

    const tokens = await authService.refreshTokens(token);

    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    res.json(tokens);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { googleId, email, name, avatarUrl, collegeId } = req.body;
    const { accessToken, refreshToken, user } = await authService.googleOAuthLogin({
      googleId,
      email,
      name,
      avatarUrl,
      collegeId
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        collegeId: user.collegeId,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getColleges = async (req: Request, res: Response) => {
  try {
    const colleges = await prisma.college.findMany({
      select: { id: true, name: true, domain: true }
    });
    res.json(colleges);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch colleges' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        college: { select: { id: true, name: true, domain: true } }
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(publicUser(user));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'UserId is required' });
    await authService.resendOTP(userId);
    res.json({ message: 'A new OTP has been sent to your email.' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
