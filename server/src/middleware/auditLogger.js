import AuditEvent from '../models/AuditEvent.js';

/**
 * Audit logger middleware — logs state-changing requests to the AuditEvent collection.
 * Apply selectively to sensitive routes after the controller has executed.
 *
 * Usage: router.post('/path', verifyToken, permit('Admin'), auditLogger('ACTION_NAME', 'ModelName'), controller)
 *
 * When used as a post-response middleware (after controller), call it before the controller
 * and it hooks into res.on('finish') to log after the response is sent.
 */
export const auditLogger = (action, targetModel) => (req, res, next) => {
  // Store the original json method to capture target ID
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    // Only log for state-changing methods
    const methods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (methods.includes(req.method)) {
      const targetId =
        req.params.id ||
        (body && (body._id || body.id)) ||
        (body && body.user && (body.user._id || body.user.id)) ||
        null;

      // Build a summary of the request body (exclude sensitive fields)
      const { password, passwordHash, ...safeMeta } = req.body || {};

      AuditEvent.create({
        actorId: req.user ? req.user.id : null,
        actorRole: req.user ? req.user.role : 'Unknown',
        action,
        targetId: targetId ? String(targetId) : null,
        targetModel,
        metadata: safeMeta,
        ip: req.ip || req.connection?.remoteAddress || 'unknown',
      }).catch((err) => {
        console.error('AuditLogger failed to write event:', err.message);
      });
    }

    return originalJson(body);
  };

  next();
};

export default auditLogger;
