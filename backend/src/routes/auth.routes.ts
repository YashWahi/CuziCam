import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resendOtpSchema,
  verifyOtpSchema,
} from '../schemas/auth.schemas';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, validateBody(registerSchema), authController.register);
router.post('/login', authLimiter, validateBody(loginSchema), authController.login);
router.post('/refresh', authLimiter, validateBody(refreshSchema), authController.refresh);
router.post('/verify-otp', authLimiter, validateBody(verifyOtpSchema), authController.verifyEmail);
router.post('/resend-otp', authLimiter, validateBody(resendOtpSchema), authController.resendOtp);
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/google', authController.googleAuth);
router.get('/me', authenticate, authController.getMe);

export default router;
