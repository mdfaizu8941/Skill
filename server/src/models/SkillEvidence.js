import mongoose from 'mongoose';

const skillEvidenceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  skillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true,
  },
  type: {
    type: String,
    enum: ['file', 'url'],
    required: true,
  },
  fileUrl: { type: String, default: '' },
  externalLink: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  mentorNote: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date, default: null },
});

skillEvidenceSchema.index({ studentId: 1, status: 1 });
skillEvidenceSchema.index({ mentorId: 1, status: 1 });

export default mongoose.model('SkillEvidence', skillEvidenceSchema);
