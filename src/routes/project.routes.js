import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  addMember,
  createProject,
  deleteProject,
  getProject,
  listProjects,
  removeMember,
  updateProject,
} from '../controllers/project.controller.js';
import { createTask, listTasks } from '../controllers/task.controller.js';
import {
  memberSchema,
  projectCreateSchema,
  projectUpdateSchema,
  taskCreateSchema,
} from '../utils/schemas.js';

const router = Router();
router.use(protect);

router.get('/', listProjects);
router.post('/', validate(projectCreateSchema), createProject);

router.get('/:projectId', getProject);
router.patch('/:projectId', validate(projectUpdateSchema), updateProject);
router.delete('/:projectId', deleteProject);

router.post('/:projectId/members', validate(memberSchema), addMember);
router.delete('/:projectId/members/:userId', removeMember);

router.get('/:projectId/tasks', listTasks);
router.post('/:projectId/tasks', validate(taskCreateSchema), createTask);

export default router;
