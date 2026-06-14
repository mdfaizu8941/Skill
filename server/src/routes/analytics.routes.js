import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { permit } from '../middleware/rbac.js';

const router = Router();

router.get('/summary', requireAuth, permit('Student'), analyticsController.getDashboardSummary);
router.get('/placement', requireAuth, permit('PlacementOfficer', 'Admin'), analyticsController.getPlacementAnalytics);

export default router;
