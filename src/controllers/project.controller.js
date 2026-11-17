import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import { PLANS } from '../config/plans.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { assertOwner, getProjectForUser, logActivity } from '../utils/access.js';

const MEMBER_FIELDS = 'name email avatarColor';

export const listProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ members: req.user._id, status: 'active' })
    .populate('members', MEMBER_FIELDS)
    .sort({ updatedAt: -1 })
    .lean();

  const counts = await Task.aggregate([
    { $match: { project: { $in: projects.map((p) => p._id) } } },
    { $group: { _id: { project: '$project', status: '$status' }, n: { $sum: 1 } } },
  ]);
  const stats = new Map();
  counts.forEach(({ _id, n }) => {
    const key = String(_id.project);
    const s = stats.get(key) || { total: 0, done: 0 };
    s.total += n;
    if (_id.status === 'done') s.done += n;
    stats.set(key, s);
  });

  res.json({
    projects: projects.map((p) => ({
      ...p,
      taskCount: stats.get(String(p._id))?.total || 0,
      doneCount: stats.get(String(p._id))?.done || 0,
    })),
  });
});

export const createProject = asyncHandler(async (req, res) => {
  const limit = PLANS[req.user.plan].limits.projects;
  const owned = await Project.countDocuments({ owner: req.user._id, status: 'active' });
  if (owned >= limit) {
    throw new ApiError(403, `Your ${PLANS[req.user.plan].name} plan allows ${limit} projects. Upgrade to create more.`, {
      code: 'PLAN_LIMIT',
    });
  }

  const project = await Project.create({
    ...req.body,
    owner: req.user._id,
    members: [req.user._id],
  });
  await project.populate('members', MEMBER_FIELDS);

  logActivity(req.user._id, project._id, 'project.created', `created the project "${project.name}"`);
  res.status(201).json({ project });
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await getProjectForUser(req.params.projectId, req.user._id);
  await project.populate('members', MEMBER_FIELDS);
  res.json({ project });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await getProjectForUser(req.params.projectId, req.user._id);
  assertOwner(project, req.user._id);

  Object.assign(project, req.body);
  await project.save();
  await project.populate('members', MEMBER_FIELDS);
  res.json({ project });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await getProjectForUser(req.params.projectId, req.user._id);
  assertOwner(project, req.user._id);

  await Promise.all([
    Task.deleteMany({ project: project._id }),
    Activity.deleteMany({ project: project._id }),
  ]);
  await project.deleteOne();
  res.json({ message: 'Project deleted' });
});

export const addMember = asyncHandler(async (req, res) => {
  const project = await getProjectForUser(req.params.projectId, req.user._id);
  assertOwner(project, req.user._id);

  const limit = PLANS[req.user.plan].limits.membersPerProject;
  if (project.members.length >= limit) {
    throw new ApiError(403, `Your ${PLANS[req.user.plan].name} plan allows ${limit} members per project. Upgrade to add more.`, {
      code: 'PLAN_LIMIT',
    });
  }

  const user = await User.findOne({ email: req.body.email });
  if (!user) throw new ApiError(404, 'No account found with that email. Ask them to sign up first.');
  if (project.members.some((m) => String(m) === String(user._id))) {
    throw new ApiError(409, `${user.name} is already in this project`);
  }

  project.members.push(user._id);
  await project.save();
  await project.populate('members', MEMBER_FIELDS);

  logActivity(req.user._id, project._id, 'member.added', `added ${user.name} to the team`);
  res.status(201).json({ project });
});

export const removeMember = asyncHandler(async (req, res) => {
  const project = await getProjectForUser(req.params.projectId, req.user._id);
  assertOwner(project, req.user._id);

  const { userId } = req.params;
  if (String(project.owner) === userId) throw new ApiError(400, 'The owner cannot be removed');

  project.members = project.members.filter((m) => String(m) !== userId);
  await project.save();
  await Task.updateMany({ project: project._id, assignee: userId }, { $set: { assignee: null } });
  await project.populate('members', MEMBER_FIELDS);

  res.json({ project });
});
