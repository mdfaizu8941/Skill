import { Router } from 'express'
import { getMyNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, getMyNotifications)
router.patch('/:id/read', requireAuth, markAsRead)
router.patch('/read-all', requireAuth, markAllAsRead)

export default router
