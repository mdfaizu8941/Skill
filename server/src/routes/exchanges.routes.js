import { Router } from 'express';
import {
  createExchange,
  listExchanges,
  updateExchangeStatus,
} from '../controllers/exchanges.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { permit } from '../middleware/rbac.js';

const router = Router();

router.get('/', requireAuth, permit('Student'), listExchanges);
router.post('/', requireAuth, permit('Student'), createExchange);
router.patch('/:id', requireAuth, permit('Student'), updateExchangeStatus);

export default router;
