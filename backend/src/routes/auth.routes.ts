import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/verify-otp', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/google', authController.googleAuth);
router.get('/colleges', authController.getColleges);
router.get('/me', authenticate, authController.getMe);

export default router;
