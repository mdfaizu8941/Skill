import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { permit } from '../middleware/rbac.js';
import * as gapController from '../controllers/gap.controller.js';

const router = Router();

router.post('/analyse', requireAuth, permit('Student'), gapController.analyse);
router.get('/reports', requireAuth, permit('Student'), gapController.getReports);
router.get('/reports/:id', requireAuth, permit('Student'), gapController.getReport);

export default router;
