import { z } from 'zod';
import { TASK_PRIORITIES, TASK_STATUSES } from '../models/Task.js';

const email = z.string().trim().toLowerCase().email('Enter a valid email address');
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const color = z.string().regex(/^#[0-9a-f]{6}$/i, 'Invalid colour');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  email,
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(100),
});

export const projectCreateSchema = z.object({
  name: z.string().trim().min(2, 'Project name must be at least 2 characters').max(80),
  description: z.string().trim().max(300).optional().default(''),
  color: color.optional(),
});

export const projectUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(300).optional(),
  color: color.optional(),
  status: z.enum(['active', 'archived']).optional(),
});

export const memberSchema = z.object({ email });

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(140),
  description: z.string().trim().max(2000).optional().default(''),
  status: z.enum(TASK_STATUSES).optional().default('todo'),
  priority: z.enum(TASK_PRIORITIES).optional().default('medium'),
  assignee: objectId.nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
});

export const taskUpdateSchema = z.object({
  title: z.string().trim().min(1).max(140).optional(),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  assignee: objectId.nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
});

export const taskMoveSchema = z.object({
  status: z.enum(TASK_STATUSES),
  index: z.number().int().min(0).default(0),
});

export const subscribeSchema = z.object({
  plan: z.enum(['free', 'pro', 'business']),
  cycle: z.enum(['monthly', 'yearly']).default('monthly'),
});
