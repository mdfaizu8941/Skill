import mongoose from 'mongoose';

const toObjectIdString = (value) => {
  if (!value) return '';
  if (value._id) return value._id.toString();
  return value.toString();
};

const exchangeSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skillOffered: { type: String, required: true },
    skillWanted: { type: String, required: true },
    note: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      set: (value) => String(value || '').toLowerCase(),
    },
  },
  { timestamps: true }
);

exchangeSchema.virtual('senderId').get(function getSenderId() {
  return toObjectIdString(this.sender);
});

exchangeSchema.virtual('receiverId').get(function getReceiverId() {
  return toObjectIdString(this.receiver);
});

exchangeSchema.index({ sender: 1, receiver: 1, status: 1 });
exchangeSchema.index({ receiver: 1, status: 1, createdAt: -1 });

exchangeSchema.set('toJSON', { virtuals: true });
exchangeSchema.set('toObject', { virtuals: true });

export default mongoose.model('Exchange', exchangeSchema);
