import { Router } from 'express';
import {
  getUnreadCounts,
  listConversations,
  listMessages,
  markConversationRead,
  markMessageRead,
  searchChatUsers,
  sendMessage,
  startConversation,
  deleteConversation,
  deleteMessage,
} from '../controllers/messages.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { permit } from '../middleware/rbac.js';

const router = Router();

router.get('/conversations', requireAuth, permit('Student'), listConversations);
router.get('/unread-counts', requireAuth, permit('Student'), getUnreadCounts);
router.get('/users/search', requireAuth, permit('Student'), searchChatUsers);
router.post('/conversations', requireAuth, permit('Student'), startConversation);
router.get('/', requireAuth, permit('Student'), listMessages);
router.post('/', requireAuth, permit('Student'), sendMessage);
router.patch('/conversations/:otherUserId/read', requireAuth, permit('Student'), markConversationRead);
router.delete('/conversations/:otherUserId', requireAuth, permit('Student'), deleteConversation);
router.patch('/:id/read', requireAuth, permit('Student'), markMessageRead);
router.delete('/:id', requireAuth, permit('Student'), deleteMessage);

export default router;
