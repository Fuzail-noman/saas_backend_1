// Single source of truth for plans, prices and limits.
// Yearly price is the per-month price when billed annually.
export const PLANS = {
  free: {
    id: 'free',
    name: 'Starter',
    tagline: 'For individuals trying things out',
    price: { monthly: 0, yearly: 0 },
    limits: { projects: 3, membersPerProject: 3 },
    features: [
      'Up to 3 projects',
      'Up to 3 members per project',
      'Kanban boards',
      'Basic analytics',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'For growing teams that ship fast',
    price: { monthly: 12, yearly: 10 },
    limits: { projects: 25, membersPerProject: 15 },
    features: [
      'Up to 25 projects',
      'Up to 15 members per project',
      'Advanced analytics',
      'Activity timeline',
      'Priority support',
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    tagline: 'For organisations that need scale',
    price: { monthly: 29, yearly: 24 },
    limits: { projects: 1000, membersPerProject: 200 },
    features: [
      'Unlimited projects',
      'Up to 200 members per project',
      'Everything in Pro',
      'Audit-friendly activity log',
      'Dedicated success manager',
    ],
  },
};

export const PLAN_IDS = Object.keys(PLANS);
