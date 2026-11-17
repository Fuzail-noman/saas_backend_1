import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Activity from '../models/Activity.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const DAYS = 14;
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

export const overview = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const projects = await Project.find({ members: uid, status: 'active' }).select('name color').lean();
  const match = { project: { $in: projects.map((p) => p._id) } };

  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (DAYS - 1));

  const [grouped, byPriority, overdue, myOpen, completedRecent, createdRecent] = await Promise.all([
    Task.aggregate([
      { $match: match },
      { $group: { _id: { project: '$project', status: '$status' }, n: { $sum: 1 } } },
    ]),
    Task.aggregate([
      { $match: { ...match, status: { $ne: 'done' } } },
      { $group: { _id: '$priority', n: { $sum: 1 } } },
    ]),
    Task.countDocuments({ ...match, status: { $ne: 'done' }, dueDate: { $lt: new Date() } }),
    Task.countDocuments({ ...match, status: { $ne: 'done' }, assignee: uid }),
    Task.find({ ...match, completedAt: { $gte: start } }).select('completedAt').lean(),
    Task.find({ ...match, createdAt: { $gte: start } }).select('createdAt').lean(),
  ]);

  // Totals by status and by project, derived from one aggregation.
  const status = { todo: 0, in_progress: 0, review: 0, done: 0 };
  const perProject = new Map();
  grouped.forEach(({ _id, n }) => {
    status[_id.status] += n;
    const p = perProject.get(String(_id.project)) || { total: 0, done: 0 };
    p.total += n;
    if (_id.status === 'done') p.done += n;
    perProject.set(String(_id.project), p);
  });
  const total = Object.values(status).reduce((a, b) => a + b, 0);

  const count = (docs, field) => {
    const map = new Map();
    docs.forEach((d) => map.set(dayKey(d[field]), (map.get(dayKey(d[field])) || 0) + 1));
    return map;
  };
  const completedMap = count(completedRecent, 'completedAt');
  const createdMap = count(createdRecent, 'createdAt');
  const series = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const key = dayKey(d);
    return { date: key, completed: completedMap.get(key) || 0, created: createdMap.get(key) || 0 };
  });

  res.json({
    totals: {
      projects: projects.length,
      tasks: total,
      completed: status.done,
      overdue,
      myOpen,
      completionRate: total ? Math.round((status.done / total) * 100) : 0,
    },
    byStatus: status,
    byPriority: Object.fromEntries(byPriority.map((p) => [p._id, p.n])),
    series,
    projectProgress: projects.map((p) => ({
      _id: p._id,
      name: p.name,
      color: p.color,
      total: perProject.get(String(p._id))?.total || 0,
      done: perProject.get(String(p._id))?.done || 0,
    })),
  });
});

export const recentActivity = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 12, 50);
  const projects = await Project.find({ members: req.user._id }).select('_id').lean();

  const activity = await Activity.find({ project: { $in: projects.map((p) => p._id) } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'name avatarColor')
    .populate('project', 'name color')
    .lean();

  res.json({ activity });
});
