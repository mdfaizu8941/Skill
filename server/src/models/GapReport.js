import mongoose from 'mongoose';

const missingSkillSubSchema = new mongoose.Schema(
  {
    skillName: { type: String, required: true },
    level: { type: String, default: 'beginner' },
    weight: { type: Number, default: 5 },
  },
  { _id: false }
);

const gapReportSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  careerRoleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CareerRole',
    default: null,
  },
  targetRole: { type: String, default: '' },
  compatibilityScore: { type: Number, min: 0, max: 100, default: 0 },
  matchedSkills: [{ type: String }],
  missingSkills: [missingSkillSubSchema],
  explanation: { type: String, default: '' },
  generatedAt: { type: Date, default: Date.now },
});

gapReportSchema.index({ studentId: 1, generatedAt: -1 });

export default mongoose.model('GapReport', gapReportSchema);
