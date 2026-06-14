import mongoose from 'mongoose';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailPattern, 'Please provide a valid email address'],
    },
    passwordHash: { type: String, required: true },
    profilePic: { type: String, default: '' },
    bio: { type: String, default: '' },
    institution: { type: String, default: '' },
    role: {
      type: String,
      enum: ['Student', 'Mentor', 'PlacementOfficer', 'Admin'],
      default: 'Student',
    },
    isActive: { type: Boolean, default: true },
    avatarUrl: { type: String, default: '' },
    lastLogin: { type: Date },
    expertiseAreas: { type: [String], default: [] },
    linkedinUrl: { type: String, default: '' },
    availability: { type: String, enum: ['accepting', 'not_accepting'], default: 'accepting' },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, isActive: 1 });

export default mongoose.model('User', userSchema);
