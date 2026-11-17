import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Activity from '../models/Activity.js';
import { ApiError } from './ApiError.js';

// Returns the project only if the user is a member of it.
export async function getProjectForUser(projectId, userId) {
  if (!mongoose.isValidObjectId(projectId)) throw new ApiError(404, 'Project not found');
  const project = await Project.findOne({ _id: projectId, members: userId });
  if (!project) throw new ApiError(404, 'Project not found');
  return project;
}

export function assertOwner(project, userId) {
  if (String(project.owner) !== String(userId)) {
    throw new ApiError(403, 'Only the project owner can do this');
  }
}

// Fire-and-forget activity log; never blocks or fails the request.
export function logActivity(userId, projectId, type, message) {
  Activity.create({ user: userId, project: projectId, type, message }).catch(() => {});
}
