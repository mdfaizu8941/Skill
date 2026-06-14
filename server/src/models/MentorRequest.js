import mongoose from 'mongoose'

const mentorRequestSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  message: { type: String, default: '', maxlength: 500 },
  respondedAt: { type: Date },
  mentorNote: { type: String, default: '' }
}, { timestamps: true })

mentorRequestSchema.index({ studentId: 1, status: 1 })
mentorRequestSchema.index({ mentorId: 1, status: 1 })
mentorRequestSchema.index({ studentId: 1, mentorId: 1 }, { unique: true })

export default mongoose.model('MentorRequest', mentorRequestSchema)
