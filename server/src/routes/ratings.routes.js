import { Router } from 'express';
import {
  createRating,
  listRateableExchanges,
  listRatings,
} from '../controllers/ratings.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { permit } from '../middleware/rbac.js';

const router = Router();

router.get('/rateable-exchanges', requireAuth, permit('Student'), listRateableExchanges);
router.get('/', requireAuth, permit('Student'), listRatings);
router.post('/', requireAuth, permit('Student'), createRating);

export default router;
