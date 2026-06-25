import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { permit } from '../middleware/rbac.js';
import { auditLogger } from '../middleware/auditLogger.js';
import { evidenceSubmitLimiter } from '../middleware/rateLimiter.js';
import * as evidenceController from '../controllers/evidence.controller.js';

const router = Router();

router.post('/', requireAuth, permit('Student'), evidenceSubmitLimiter, evidenceController.submit);
router.get('/my', requireAuth, permit('Student'), evidenceController.getMy);
router.get('/pending', requireAuth, permit('Mentor'), evidenceController.getPending);
router.get('/reviewed', requireAuth, permit('Mentor'), evidenceController.getReviewed);
router.patch(
  '/:id/review',
  requireAuth,
  permit('Mentor'),
  auditLogger('EVIDENCE_REVIEWED', 'SkillEvidence'),
  evidenceController.review
);

export default router;
