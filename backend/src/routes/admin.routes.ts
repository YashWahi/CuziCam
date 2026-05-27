import { Router } from 'express';
import { banUser, getAllReports } from '../controllers/moderation.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { adminBanSchema } from '../schemas/user.schemas';

const router = Router();

router.get('/reports', authenticate, requireRole(['ADMIN']), getAllReports);
router.post('/ban', authenticate, requireRole(['ADMIN']), validateBody(adminBanSchema), banUser);

export default router;
