import { Router } from 'express';
import { getAllReports, banUser, getModerationStats } from '../controllers/moderation.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Only Admins or Moderators can access these
router.get('/reports', authenticate, requireRole(['ADMIN', 'MODERATOR']), getAllReports);
router.post('/ban', authenticate, requireRole(['ADMIN']), banUser);
router.get('/stats', authenticate, requireRole(['ADMIN', 'MODERATOR']), getModerationStats);

export default router;
