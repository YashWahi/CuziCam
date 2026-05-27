import { z } from 'zod';

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  college: z.string().trim().min(1).max(120).optional(),
  collegeId: z.string().uuid().optional(),
  bio: z.string().trim().max(240).optional(),
  year: z.string().trim().max(40).optional(),
  branch: z.string().trim().max(80).optional(),
  interests: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  gender: z.enum(['male', 'female']).optional(),
  avatarUrl: z.string().url().optional(),
});

export const reportSchema = z.object({
  reportedId: z.string().uuid(),
  reason: z.enum(['fake_profile', 'harassment', 'inappropriate_content', 'underage']),
  sessionId: z.string().uuid(),
});

export const blockSchema = z.object({
  blockedId: z.string().uuid(),
});

export const adminBanSchema = z.object({
  userId: z.string().uuid(),
});

export const confessionCreateSchema = z.object({
  content: z.string().trim().min(1).max(500),
  isAnonymous: z.boolean().default(true),
});
