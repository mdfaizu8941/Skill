import mongoose from 'mongoose';

const stepSubSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  resourceUrl: { type: String, default: null },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending',
  },
  order: { type: Number, default: 0 },
});

const aiMetadataSchema = new mongoose.Schema(
  {
    model: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
  },
  { _id: false }
);

const roadmapSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    gapReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GapReport',
      required: true,
    },
    careerRoleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CareerRole',
      default: null,
    },
    steps: [stepSubSchema],
    overallStatus: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active',
    },
    aiMetadata: { type: aiMetadataSchema, default: () => ({}) },
  },
  { timestamps: true }
);

roadmapSchema.index({ studentId: 1, overallStatus: 1 });

export default mongoose.model('Roadmap', roadmapSchema);
