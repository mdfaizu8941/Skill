import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'EVIDENCE_APPROVED',
      'EVIDENCE_REJECTED',
      'MENTOR_ASSIGNED',
      'GAP_ANALYSIS_COMPLETE',
      'ROADMAP_GENERATED',
      'PLACEMENT_ANNOUNCEMENT',
      'OPPORTUNITY_UPDATE',
      'SYSTEM'
    ],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  link: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
})

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 })

export default mongoose.model('Notification', notificationSchema)
