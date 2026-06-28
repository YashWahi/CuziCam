import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { onboardingSchema } from '../schemas/auth.schemas';
import { blockSchema, profileUpdateSchema, reportSchema } from '../schemas/user.schemas';

const router = Router();
const reportLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, validateBody(profileUpdateSchema), userController.updateProfile);
router.get('/me', authenticate, userController.getMe);
router.patch('/me', authenticate, validateBody(profileUpdateSchema), userController.updateProfile);
router.get('/connections', authenticate, userController.getConnections);
router.get('/leaderboard', authenticate, userController.getLeaderboard);
router.post('/me/onboarding', authenticate, validateBody(onboardingSchema), userController.onboarding);
router.post('/report', authenticate, reportLimiter, validateBody(reportSchema), userController.reportUser);
router.post('/block', authenticate, validateBody(blockSchema), userController.blockUser);
router.get('/blocks', authenticate, userController.getBlocks);
router.get('/me/stats', authenticate, userController.getUserStats);
router.delete('/me', authenticate, userController.deleteUser);

export default router;
