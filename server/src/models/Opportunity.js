import mongoose from 'mongoose';

const eligibilitySchema = new mongoose.Schema(
  {
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
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'rejected', 'selected', 'withdrawn'],
      default: 'applied',
    },
    note: { type: String, default: '' },
    appliedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const opportunitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    organization: { type: String, default: '', trim: true },
    category: {
      type: String,
      enum: ['Internship', 'Placement', 'Hackathon', 'Scholarship', 'Workshop', 'Competition'],
      required: true,
    },
    description: { type: String, default: '' },
    location: { type: String, default: '' },
    externalUrl: { type: String, default: '' },
    deadline: { type: Date, required: true },
    eventDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ['draft', 'active', 'closed', 'archived'],
      default: 'active',
    },
    eligibility: { type: eligibilitySchema, default: () => ({}) },
    applications: { type: [applicationSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

opportunitySchema.index({ status: 1, deadline: 1 });
opportunitySchema.index({ category: 1, status: 1 });
opportunitySchema.index({ title: 'text', organization: 'text', description: 'text' });

export default mongoose.model('Opportunity', opportunitySchema);
