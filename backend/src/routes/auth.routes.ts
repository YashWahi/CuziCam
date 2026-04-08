import { Router } from 'express';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.get('/verify-email', authController.verifyEmail);
router.post('/google', authController.googleAuth);
router.get('/colleges', authController.getColleges);

export default router;
