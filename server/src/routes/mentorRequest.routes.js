import { Router } from 'express'
import {
  getMentors,
  sendRequest,
  getIncomingRequests,
  respondToRequest,
  getStudentDetail
} from '../controllers/mentorRequest.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { permit } from '../middleware/rbac.js'

const router = Router()

// Student routes
router.get('/mentors', requireAuth, permit('Student'), getMentors)
router.post('/mentors/:mentorId/request', requireAuth, permit('Student'), sendRequest)

// Mentor routes
router.get('/mentor/requests', requireAuth, permit('Mentor'), getIncomingRequests)
router.patch('/mentor/requests/:requestId', requireAuth, permit('Mentor'), respondToRequest)
router.get('/mentor/students/:userId', requireAuth, permit('Mentor'), getStudentDetail)

export default router
