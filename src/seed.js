// Creates a demo workspace. Safe to re-run: it only replaces data owned by the demo accounts.
//   npm run seed   ->   login: demo@nimbus.app / Demo@1234
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Project from './models/Project.js';
import Task from './models/Task.js';
import Activity from './models/Activity.js';

const DEMO_PASSWORD = 'Demo@1234';
const day = 864e5;
const ago = (d) => new Date(Date.now() - d * day);
const inDays = (d) => new Date(Date.now() + d * day);

await connectDB();

const demoUsers = await User.find({ email: /@nimbus\.app$/ }).select('_id');
const demoIds = demoUsers.map((u) => u._id);
const demoProjects = await Project.find({ owner: { $in: demoIds } }).select('_id');
const projectIds = demoProjects.map((p) => p._id);
await Promise.all([
  Task.deleteMany({ project: { $in: projectIds } }),
  Activity.deleteMany({ project: { $in: projectIds } }),
]);
await Project.deleteMany({ _id: { $in: projectIds } });
await User.deleteMany({ _id: { $in: demoIds } });

const [demo, aisha, omar] = await Promise.all([
  User.create({ name: 'Demo User', email: 'demo@nimbus.app', password: DEMO_PASSWORD, plan: 'pro', billingCycle: 'yearly', planRenewsAt: inDays(300), avatarColor: '#ff5b2e' }),
  User.create({ name: 'Aisha Khan', email: 'aisha@nimbus.app', password: DEMO_PASSWORD, avatarColor: '#6c5ce7' }),
  User.create({ name: 'Omar Siddiqui', email: 'omar@nimbus.app', password: DEMO_PASSWORD, avatarColor: '#12b886' }),
]);

const team = [demo._id, aisha._id, omar._id];
const [website, mobile, launch] = await Project.create([
  { owner: demo._id, name: 'Website Redesign', description: 'Fresh marketing site with faster load times and a new brand.', color: '#ff5b2e', members: team },
  { owner: demo._id, name: 'Mobile App v2', description: 'Offline mode, push notifications and a cleaner onboarding flow.', color: '#6c5ce7', members: [demo._id, aisha._id] },
  { owner: demo._id, name: 'Q4 Launch Campaign', description: 'Plan, design and ship the launch across all channels.', color: '#12b886', members: [demo._id, omar._id] },
]);

const t = (project, title, status, priority, assignee, extra = {}) => ({
  project: project._id,
  title,
  status,
  priority,
  assignee,
  createdBy: demo._id,
  ...extra,
});

const tasks = [
  t(website, 'Audit current site performance', 'done', 'high', demo._id, { completedAt: ago(9), createdAt: ago(14) }),
  t(website, 'Define new design language', 'done', 'medium', aisha._id, { completedAt: ago(6), createdAt: ago(13) }),
  t(website, 'Design homepage hero', 'done', 'high', aisha._id, { completedAt: ago(3), createdAt: ago(10) }),
  t(website, 'Build pricing page', 'review', 'high', omar._id, { dueDate: inDays(2), createdAt: ago(7) }),
  t(website, 'Implement scroll animations', 'in_progress', 'medium', demo._id, { dueDate: inDays(4), createdAt: ago(5) }),
  t(website, 'Write case study copy', 'in_progress', 'low', aisha._id, { createdAt: ago(4) }),
  t(website, 'Set up analytics events', 'todo', 'medium', omar._id, { dueDate: inDays(7), createdAt: ago(3) }),
  t(website, 'Fix broken links from old site', 'todo', 'urgent', demo._id, { dueDate: inDays(-1), createdAt: ago(2) }),
  t(mobile, 'Offline sync engine', 'in_progress', 'urgent', demo._id, { dueDate: inDays(5), createdAt: ago(8) }),
  t(mobile, 'Push notification service', 'todo', 'high', aisha._id, { createdAt: ago(6) }),
  t(mobile, 'Redesign onboarding screens', 'done', 'medium', aisha._id, { completedAt: ago(2), createdAt: ago(12) }),
  t(mobile, 'Crash reporting integration', 'done', 'low', demo._id, { completedAt: ago(1), createdAt: ago(9) }),
  t(mobile, 'Beta tester recruitment', 'review', 'medium', demo._id, { createdAt: ago(5) }),
  t(launch, 'Launch messaging framework', 'done', 'high', omar._id, { completedAt: ago(5), createdAt: ago(11) }),
  t(launch, 'Produce launch video', 'in_progress', 'high', omar._id, { dueDate: inDays(6), createdAt: ago(6) }),
  t(launch, 'Prepare press kit', 'todo', 'medium', demo._id, { dueDate: inDays(9), createdAt: ago(3) }),
  t(launch, 'Schedule social posts', 'todo', 'low', null, { createdAt: ago(1) }),
];

// Give every task a stable order inside its column.
const counters = new Map();
tasks.forEach((task) => {
  const key = `${task.project}-${task.status}`;
  task.order = counters.get(key) || 0;
  counters.set(key, task.order + 1);
});
await Task.insertMany(tasks, { timestamps: false });

await Activity.insertMany(
  [
    [aisha._id, website._id, 'task.completed', 'completed "Design homepage hero"', 3],
    [demo._id, mobile._id, 'task.completed', 'completed "Crash reporting integration"', 1],
    [omar._id, launch._id, 'task.moved', 'moved "Produce launch video" to In progress', 2],
    [demo._id, website._id, 'member.added', 'added Omar Siddiqui to the team', 8],
    [aisha._id, mobile._id, 'task.completed', 'completed "Redesign onboarding screens"', 2],
    [demo._id, launch._id, 'task.created', 'added the task "Prepare press kit"', 3],
    [omar._id, website._id, 'task.moved', 'moved "Build pricing page" to In review', 1],
  ].map(([user, project, type, message, d]) => ({ user, project, type, message, createdAt: ago(d * 0.7) }))
);

console.log('Seeded demo data.');
console.log('Login: demo@nimbus.app / ' + DEMO_PASSWORD);
await mongoose.disconnect();
