import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    color: { type: String, default: '#ff5b2e' },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

projectSchema.index({ members: 1, updatedAt: -1 });

export default mongoose.models.Project || mongoose.model('Project', projectSchema);
