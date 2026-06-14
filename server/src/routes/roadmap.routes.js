import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { permit } from '../middleware/rbac.js';
import * as roadmapController from '../controllers/roadmap.controller.js';

const router = Router();

router.post('/generate', requireAuth, permit('Student'), roadmapController.generate);
router.get('/my', requireAuth, permit('Student'), roadmapController.getMy);
router.patch('/steps/:stepId', requireAuth, permit('Student'), roadmapController.updateStep);

export default router;
