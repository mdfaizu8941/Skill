import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skillName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Expert'], default: 'Beginner' },
    description: { type: String, default: '' },
    wantsToLearn: { type: [String], default: [] },
    organizationId: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Skill', skillSchema);
