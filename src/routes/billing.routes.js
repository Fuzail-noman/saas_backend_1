import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { currentBilling, listPlans, subscribe } from '../controllers/billing.controller.js';
import { subscribeSchema } from '../utils/schemas.js';

const router = Router();

router.get('/plans', listPlans);
router.get('/', protect, currentBilling);
router.post('/subscribe', protect, validate(subscribeSchema), subscribe);

export default router;
