import AuditEvent from '../models/AuditEvent.js'

/**
 * Creates an audit event. Never throws — failures are logged to console only.
 */
export const audit = async ({
  actorId,
  actorRole,
  action,
  targetId = null,
  targetModel = null,
  metadata = {},
  ip = 'unknown'
}) => {
  try {
    await AuditEvent.create({
      actorId,
      actorRole,
      action,
      targetId: targetId?.toString() || null,
      targetModel,
      metadata,
      ip
    })
  } catch (err) {
    console.error('Audit log failed:', err.message)
  }
}
