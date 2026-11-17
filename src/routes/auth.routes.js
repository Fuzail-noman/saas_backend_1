import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  changePassword,
  login,
  me,
  register,
  updateProfile,
} from '../controllers/auth.controller.js';
import { loginSchema, passwordSchema, profileSchema, registerSchema } from '../utils/schemas.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, me);
router.patch('/me', protect, validate(profileSchema), updateProfile);
router.patch('/password', protect, validate(passwordSchema), changePassword);

export default router;
