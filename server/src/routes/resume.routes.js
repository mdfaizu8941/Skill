import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/auth.js'
import { permit } from '../middleware/rbac.js'
import { parseResume } from '../controllers/resume.controller.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post('/parse', requireAuth, permit('Student'), upload.single('resume'), parseResume)

export default router