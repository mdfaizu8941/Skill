import { Router } from 'express';
import { login, me, register, updateMe, adminCreateUser } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { permit } from '../middleware/rbac.js';
import { auditLogger } from '../middleware/auditLogger.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', requireAuth, me);
router.put('/me', requireAuth, updateMe);

// Admin-only: create users with any role (PlacementOfficer, Admin, etc.)
router.post(
  '/admin/create-user',
  requireAuth,
  permit('Admin'),
  auditLogger('USER_CREATED', 'User'),
  adminCreateUser
);

export default router;
