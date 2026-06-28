import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getAllReports, banUser, getModerationStats, createReport } from '../controllers/moderation.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { adminBanSchema, reportSchema } from '../schemas/user.schemas';

const router = Router();
const reportLimiter = rateLimit({ windowMs: 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

// Only Admins or Moderators can access these
router.get('/reports', authenticate, requireRole(['ADMIN', 'MODERATOR']), getAllReports);
router.post('/ban', authenticate, requireRole(['ADMIN']), validateBody(adminBanSchema), banUser);
router.get('/stats', authenticate, requireRole(['ADMIN', 'MODERATOR']), getModerationStats);

// Public reporting route (any auth user can report)
router.post('/report', authenticate, reportLimiter, validateBody(reportSchema), createReport);

export default router;
