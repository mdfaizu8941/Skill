import { Router } from 'express'
import { getMe, updateMe, uploadAvatar, deleteAvatar, getById } from '../controllers/profile.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { permit } from '../middleware/rbac.js'
import { uploadAvatar as uploadAvatarMiddleware } from '../config/multerCloudinary.js'

const router = Router()

router.get('/me', requireAuth, getMe)
router.put('/me', requireAuth, updateMe)
router.put('/me/avatar', requireAuth, uploadAvatarMiddleware.single('avatar'), uploadAvatar)
router.delete('/me/avatar', requireAuth, deleteAvatar)
router.get('/:userId', requireAuth, permit('Student', 'Mentor', 'PlacementOfficer', 'Admin'), getById)

export default router
