import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { permit } from '../middleware/rbac.js';
import * as mentorController from '../controllers/mentor.controller.js';

const router = Router();

router.get('/students', requireAuth, permit('Mentor'), mentorController.getStudents);

export default router;
