import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    exchange: { type: mongoose.Schema.Types.ObjectId, ref: 'Exchange' },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, default: '' },
    attachmentUrl: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
