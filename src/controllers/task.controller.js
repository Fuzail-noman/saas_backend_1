import mongoose from 'mongoose';
import Task from '../models/Task.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getProjectForUser, logActivity } from '../utils/access.js';

const ASSIGNEE_FIELDS = 'name avatarColor';
const STATUS_LABEL = { todo: 'To do', in_progress: 'In progress', review: 'In review', done: 'Done' };

function assertAssigneeIsMember(project, assignee) {
  if (assignee && !project.members.some((m) => String(m) === String(assignee))) {
    throw new ApiError(400, 'Assignee must be a member of this project');
  }
}

async function loadTask(taskId, userId) {
  if (!mongoose.isValidObjectId(taskId)) throw new ApiError(404, 'Task not found');
  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, 'Task not found');
  const project = await getProjectForUser(task.project, userId);
  return { task, project };
}

export const listTasks = asyncHandler(async (req, res) => {
  const project = await getProjectForUser(req.params.projectId, req.user._id);
  const tasks = await Task.find({ project: project._id })
    .sort({ order: 1, createdAt: 1 })
    .populate('assignee', ASSIGNEE_FIELDS);
  res.json({ tasks });
});

export const createTask = asyncHandler(async (req, res) => {
  const project = await getProjectForUser(req.params.projectId, req.user._id);
  assertAssigneeIsMember(project, req.body.assignee);

  const order = await Task.countDocuments({ project: project._id, status: req.body.status });
  const task = await Task.create({
    ...req.body,
    project: project._id,
    createdBy: req.user._id,
    order,
    completedAt: req.body.status === 'done' ? new Date() : null,
  });
  await task.populate('assignee', ASSIGNEE_FIELDS);

  logActivity(req.user._id, project._id, 'task.created', `added the task "${task.title}"`);
  res.status(201).json({ task });
});

export const updateTask = asyncHandler(async (req, res) => {
  const { task, project } = await loadTask(req.params.taskId, req.user._id);
  if (req.body.assignee !== undefined) assertAssigneeIsMember(project, req.body.assignee);

  const wasDone = task.status === 'done';
  Object.assign(task, req.body);
  if (task.status === 'done' && !wasDone) task.completedAt = new Date();
  if (task.status !== 'done') task.completedAt = null;
  await task.save();
  await task.populate('assignee', ASSIGNEE_FIELDS);

  if (task.status === 'done' && !wasDone) {
    logActivity(req.user._id, project._id, 'task.completed', `completed "${task.title}"`);
  }
  res.json({ task });
});

// Moves a task to a column at a given position and re-numbers the affected columns.
export const moveTask = asyncHandler(async (req, res) => {
  const { task, project } = await loadTask(req.params.taskId, req.user._id);
  const { status, index } = req.body;

  const previousStatus = task.status;
  const siblings = await Task.find({ project: project._id, status, _id: { $ne: task._id } })
    .sort({ order: 1, createdAt: 1 })
    .select('_id');

  const ids = siblings.map((t) => t._id);
  ids.splice(Math.min(index, ids.length), 0, task._id);

  const ops = ids.map((id, order) => ({
    updateOne: {
      filter: { _id: id },
      update: {
        $set: {
          order,
          ...(String(id) === String(task._id)
            ? { status, completedAt: status === 'done' ? task.completedAt || new Date() : null }
            : {}),
        },
      },
    },
  }));
  await Task.bulkWrite(ops);

  if (previousStatus !== status) {
    logActivity(
      req.user._id,
      project._id,
      status === 'done' ? 'task.completed' : 'task.moved',
      status === 'done'
        ? `completed "${task.title}"`
        : `moved "${task.title}" to ${STATUS_LABEL[status]}`
    );
  }

  const updated = await Task.findById(task._id).populate('assignee', ASSIGNEE_FIELDS);
  res.json({ task: updated });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const { task } = await loadTask(req.params.taskId, req.user._id);
  await task.deleteOne();
  res.json({ message: 'Task deleted' });
});
