import mongoose from 'mongoose';

const eligibilityCriteriaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', default: null },
    minCgpa: { type: Number, min: 0, max: 10, default: 0 },
    requiredSkills: { type: [String], default: [] },
    branches: { type: [String], default: [] },
    years: { type: [Number], default: [] },
    certifications: { type: [String], default: [] },
    placementStatuses: { type: [String], default: [] },
    mentorAssigned: {
      type: String,
      enum: ['any', 'assigned', 'unassigned'],
      default: 'any',
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

eligibilityCriteriaSchema.index({ createdBy: 1, createdAt: -1 });
eligibilityCriteriaSchema.index({ opportunityId: 1 });

export default mongoose.model('EligibilityCriteria', eligibilityCriteriaSchema);
