import Project from '../models/Project.js';
import { PLANS } from '../config/plans.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listPlans = asyncHandler(async (_req, res) => {
  res.json({ plans: Object.values(PLANS) });
});

export const currentBilling = asyncHandler(async (req, res) => {
  const plan = PLANS[req.user.plan];
  const projectsUsed = await Project.countDocuments({ owner: req.user._id, status: 'active' });

  res.json({
    plan,
    billingCycle: req.user.billingCycle,
    renewsAt: req.user.planRenewsAt,
    usage: { projects: projectsUsed, projectsLimit: plan.limits.projects },
  });
});

// NOTE: demo billing. No payment is taken - the plan is switched immediately.
// To go live, create a Stripe Checkout session here and switch the plan from a webhook.
export const subscribe = asyncHandler(async (req, res) => {
  const { plan, cycle } = req.body;

  req.user.plan = plan;
  req.user.billingCycle = cycle;
  req.user.planRenewsAt =
    plan === 'free' ? null : new Date(Date.now() + (cycle === 'yearly' ? 365 : 30) * 864e5);
  await req.user.save();

  res.json({
    user: req.user,
    message: plan === 'free' ? 'You are now on the Starter plan' : `Welcome to ${PLANS[plan].name}!`,
  });
});
