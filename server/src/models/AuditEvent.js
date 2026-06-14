import mongoose from 'mongoose';

const auditEventSchema = new mongoose.Schema({
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  actorRole: { type: String, default: 'Unknown' },
  action: { type: String, required: true },
  targetId: { type: String, default: null },
  targetModel: { type: String, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  ip: { type: String, default: 'unknown' },
  timestamp: { type: Date, default: Date.now, immutable: true },
});

// Prevent deletion of audit events
auditEventSchema.pre('remove', function () {
  throw new Error('AuditEvent documents cannot be deleted');
});

auditEventSchema.pre('deleteOne', function () {
  throw new Error('AuditEvent documents cannot be deleted');
});

auditEventSchema.pre('findOneAndDelete', function () {
  throw new Error('AuditEvent documents cannot be deleted');
});

auditEventSchema.pre('deleteMany', function () {
  throw new Error('AuditEvent documents cannot be deleted');
});

auditEventSchema.index({ actorRole: 1, action: 1, timestamp: -1 });

export default mongoose.model('AuditEvent', auditEventSchema);
