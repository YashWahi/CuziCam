import { Router } from 'express';
import { createConfession, getConfessionsByCollege, upvoteConfession } from '../controllers/confession.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { confessionCreateSchema } from '../schemas/user.schemas';

const router = Router();

// Get confessions for the user's college
router.get('/', authenticate, getConfessionsByCollege);

// Create a new confession
router.post('/', authenticate, validateBody(confessionCreateSchema), createConfession);

// Upvote a confession
router.post('/:id/upvote', authenticate, upvoteConfession);
router.post('/:id/like', authenticate, upvoteConfession);

export default router;
