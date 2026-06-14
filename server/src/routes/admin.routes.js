import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { permit } from '../middleware/rbac.js';
import { auditLogger } from '../middleware/auditLogger.js';
import * as adminController from '../controllers/admin.controller.js';

const router = Router();

router.get('/users', requireAuth, permit('Admin'), adminController.getUsers);
router.patch(
  '/users/:id/role',
  requireAuth,
  permit('Admin'),
  auditLogger('ROLE_CHANGED', 'User'),
  adminController.changeRole
);
router.patch(
  '/users/:id/status',
  requireAuth,
  permit('Admin'),
  auditLogger('USER_STATUS_CHANGED', 'User'),
  adminController.changeStatus
);
router.get('/audit-logs', requireAuth, permit('Admin'), adminController.getAuditLogs);

export default router;
