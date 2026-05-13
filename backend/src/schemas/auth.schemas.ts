import { z } from 'zod';

const eduEmail = z.string().email().refine((email) => email.toLowerCase().endsWith('.edu'), {
  message: 'Email must be a .edu address',
});

export const registerSchema = z.object({
  email: eduEmail.transform((email) => email.toLowerCase().trim()),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(80),
  gender: z.enum(['male', 'female']),
  college: z.string().trim().min(1).max(120),
});

export const loginSchema = z.object({
  email: z.string().email().transform((email) => email.toLowerCase().trim()),
  password: z.string().min(1).max(128),
});

export const verifyOtpSchema = z.object({
  userId: z.string().uuid(),
  otp: z.string().regex(/^\d{6}$/),
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});

export const resendOtpSchema = z.object({
  userId: z.string().uuid(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().transform((email) => email.toLowerCase().trim()),
});

export const onboardingSchema = z.object({
  college: z.string().trim().min(1).max(120).optional(),
  collegeId: z.string().uuid().optional(),
  year: z.string().trim().max(40).optional(),
  branch: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(240).optional(),
  interests: z.array(z.string().trim().min(1).max(40)).max(12),
}).refine((data) => data.college || data.collegeId, {
  message: 'college or collegeId is required',
});
