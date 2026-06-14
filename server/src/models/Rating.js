import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema(
  {
    exchange: { type: mongoose.Schema.Types.ObjectId, ref: 'Exchange', required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stars: { type: Number, min: 1, max: 5, required: true },
    feedback: { type: String, default: '' },
  },
  { timestamps: true }
);

ratingSchema.index({ exchange: 1, reviewer: 1 }, { unique: true });
ratingSchema.index({ reviewee: 1, createdAt: -1 });

export default mongoose.model('Rating', ratingSchema);
