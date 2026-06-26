import AuditEvent from '../models/AuditEvent.js'
import { redactPII } from '../utils/sanitizer.js'

const redactMetadata = (metadata) => {
  if (!metadata || typeof metadata !== 'object') return metadata
  const str = JSON.stringify(metadata)
  const redacted = redactPII(str)
  try { return JSON.parse(redacted) } catch { return metadata }
}

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
      metadata: redactMetadata(metadata),
      ip
    })
  } catch (err) {
    console.error('Audit log failed:', err.message)
  }
}
