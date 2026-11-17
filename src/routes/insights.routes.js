import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { overview, recentActivity } from '../controllers/analytics.controller.js';

const router = Router();
router.use(protect);

router.get('/analytics/overview', overview);
router.get('/activity', recentActivity);

export default router;
