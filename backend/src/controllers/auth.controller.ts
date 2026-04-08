import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { prisma } from '../lib/prisma';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, collegeId, year, branch, interests } = req.body;
    
    // Initial validation
    if (!email || !password || !name || !collegeId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { user, emailVerifyToken } = await authService.registerWithEmail({
      email,
      password,
      name,
      collegeId,
      year,
      branch,
      interests
    });

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify.',
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
    res.status(401).json({ error: error.message });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const tokens = await authService.refreshTokens(refreshToken);
    res.json(tokens);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') return res.status(400).json({ error: 'Token is required' });

    await authService.verifyEmail(token);
    res.json({ message: 'Email verified successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
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
