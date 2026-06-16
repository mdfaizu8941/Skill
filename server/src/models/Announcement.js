import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    audienceType: {
      type: String,
      enum: ['all', 'selected', 'eligible', 'filtered'],
      default: 'all',
    },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    recipientIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    channels: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
    },
    emailStatus: {
      type: String,
      enum: ['not_requested', 'sent', 'partial', 'failed', 'skipped'],
      default: 'not_requested',
    },
    deliverySummary: {
      inAppCount: { type: Number, default: 0 },
      emailSent: { type: Number, default: 0 },
      emailFailed: { type: Number, default: 0 },
      emailSkipped: { type: Number, default: 0 },
    },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

announcementSchema.index({ senderId: 1, sentAt: -1 });
announcementSchema.index({ audienceType: 1, sentAt: -1 });

export default mongoose.model('Announcement', announcementSchema);
