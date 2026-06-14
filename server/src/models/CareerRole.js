import mongoose from 'mongoose';

const requiredSkillSubSchema = new mongoose.Schema(
  {
    skillName: { type: String, required: true },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    weight: { type: Number, min: 1, max: 10, default: 5 },
  },
  { _id: false }
);

const careerRoleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  industry: { type: String, default: '' },
  requiredSkills: [requiredSkillSubSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

careerRoleSchema.index({ isActive: 1 });

export default mongoose.model('CareerRole', careerRoleSchema);
