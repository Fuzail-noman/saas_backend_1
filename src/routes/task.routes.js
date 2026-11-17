import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { deleteTask, moveTask, updateTask } from '../controllers/task.controller.js';
import { taskMoveSchema, taskUpdateSchema } from '../utils/schemas.js';

const router = Router();
router.use(protect);

router.patch('/:taskId', validate(taskUpdateSchema), updateTask);
router.patch('/:taskId/move', validate(taskMoveSchema), moveTask);
router.delete('/:taskId', deleteTask);

export default router;
