import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    university: { type: String, default: '' },
    enrollmentYear: { type: Number },
    graduationYear: { type: Number },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    avatarUrl: { type: String, default: '' },
    avatarPublicId: { type: String, default: '' },

  },
  { timestamps: true }
);

export default mongoose.model('StudentProfile', studentProfileSchema);
