import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { prisma } from '../lib/prisma';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, collegeId, year, branch, interests } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { user } = await authService.registerWithEmail({
      email,
      password,
      name,
      collegeId,
      year,
      branch,
      interests
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

    // Set HTTP-only cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000 // 1h
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600000 // 7d
    });

    res.json({
      accessToken, // Keep for legacy/manual header support if needed
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
    const status = error.cause === 'UNVERIFIED' ? 403 : 401;
    res.status(status).json({ error: error.message, code: error.cause });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) return res.status(400).json({ error: 'UserId and OTP are required' });

    await authService.verifyOTP(userId, otp);
    res.json({ message: 'Email verified successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
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

    // Set HTTP-only cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000 // 1h
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600000 // 7d
    });

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

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
