import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { permit } from '../middleware/rbac.js';
import { auditLogger } from '../middleware/auditLogger.js';
import * as careerRoleController from '../controllers/careerRole.controller.js';

const router = Router();

// Public — no auth required
router.get('/', careerRoleController.getAll);

// Admin only
router.post(
  '/',
  requireAuth,
  permit('Admin'),
  auditLogger('CAREER_ROLE_CREATED', 'CareerRole'),
  careerRoleController.create
);
router.put(
  '/:id',
  requireAuth,
  permit('Admin'),
  auditLogger('CAREER_ROLE_UPDATED', 'CareerRole'),
  careerRoleController.update
);
router.delete(
  '/:id',
  requireAuth,
  permit('Admin'),
  auditLogger('CAREER_ROLE_DELETED', 'CareerRole'),
  careerRoleController.softDelete
);

export default router;
