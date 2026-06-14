import { asyncHandler } from '../utils/asyncHandler.js'
import MentorRequest from '../models/MentorRequest.js'
import User from '../models/User.js'
import StudentProfile from '../models/StudentProfile.js'
import Skill from '../models/Skill.js'
import { createNotification } from '../services/notificationService.js'

// GET /api/mentors — Student browses available mentors
export const getMentors = asyncHandler(async (req, res) => {
  const { expertise, availability, search } = req.query
  
  const filter = { role: 'Mentor', isActive: true }
  if (availability) filter.availability = availability
  if (expertise) filter.expertiseAreas = { $in: [new RegExp(expertise, 'i')] }
  if (search) filter.name = { $regex: search, $options: 'i' }
  
  const mentors = await User.find(filter)
    .select('-passwordHash -__v')
    .sort({ name: 1 })
  
  // Get existing request status for this student
  const existingRequests = await MentorRequest.find({
    studentId: req.user.id,
    mentorId: { $in: mentors.map(m => m._id) }
  })
  
  const requestMap = {}
  existingRequests.forEach(r => {
    requestMap[r.mentorId.toString()] = r.status
  })
  
  const mentorsWithStatus = mentors.map(m => ({
    ...m.toObject(),
    requestStatus: requestMap[m._id.toString()] || null
  }))
  
  res.json({ mentors: mentorsWithStatus })
})

// POST /api/mentors/:mentorId/request — Student sends connection request
export const sendRequest = asyncHandler(async (req, res) => {
  const { mentorId } = req.params
  const { message } = req.body
  
  const mentor = await User.findOne({ _id: mentorId, role: 'Mentor', isActive: true })
  if (!mentor) return res.status(404).json({ message: 'Mentor not found' })
  
  const existing = await MentorRequest.findOne({
    studentId: req.user.id,
    mentorId
  })
  if (existing) {
    return res.status(409).json({
      message: `You already have a ${existing.status} request with this mentor`
    })
  }
  
  const request = await MentorRequest.create({
    studentId: req.user.id,
    mentorId,
    message: message || ''
  })
  
  await createNotification({
    recipientId: mentorId,
    type: 'SYSTEM',
    title: 'New Connection Request',
    message: `A student has sent you a mentorship connection request.`,
    link: '/mentor/requests'
  })
  
  res.status(201).json({ request })
})

// GET /api/mentor/requests — Mentor sees incoming requests
export const getIncomingRequests = asyncHandler(async (req, res) => {
  const requests = await MentorRequest.find({ mentorId: req.user.id })
    .populate('studentId', 'name email avatarUrl')
    .sort({ createdAt: -1 })
  
  res.json({ requests })
})

// PATCH /api/mentor/requests/:requestId — Mentor accepts or declines
export const respondToRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params
  const { status, mentorNote } = req.body
  
  if (!['accepted', 'declined'].includes(status)) {
    return res.status(400).json({ message: 'status must be accepted or declined' })
  }
  
  const request = await MentorRequest.findOne({
    _id: requestId,
    mentorId: req.user.id
  })
  if (!request) return res.status(404).json({ message: 'Request not found' })
  
  request.status = status
  request.mentorNote = mentorNote || ''
  request.respondedAt = new Date()
  await request.save()
  
  if (status === 'accepted') {
    await StudentProfile.findOneAndUpdate(
      { userId: request.studentId },
      { mentorId: req.user.id },
      { upsert: true }
    )
  }
  
  await createNotification({
    recipientId: request.studentId,
    type: 'MENTOR_ASSIGNED',
    title: status === 'accepted' ? 'Mentor Request Accepted' : 'Mentor Request Declined',
    message: status === 'accepted'
      ? `Your mentorship request has been accepted. You now have a mentor assigned.`
      : `Your mentorship request was declined. ${mentorNote ? 'Note: ' + mentorNote : ''}`,
    link: '/student/profile'
  })
  
  res.json({ request })
})

// GET /api/mentor/students/:userId — Mentor views full student detail
export const getStudentDetail = asyncHandler(async (req, res) => {
  const { userId } = req.params
  
  const [user, profile, skills, reports, roadmap, evidence] = await Promise.all([
    User.findById(userId).select('-passwordHash -__v'),
    StudentProfile.findOne({ userId }),
    Skill.find({ user: userId }),
    (await import('../models/GapReport.js')).default.find({ studentId: userId })
      .sort({ generatedAt: -1 }).limit(5),
    (await import('../models/Roadmap.js')).default.findOne({
      studentId: userId,
      overallStatus: 'active'
    }),
    (await import('../models/SkillEvidence.js')).default.find({ studentId: userId })
      .populate('skillId', 'skillName')
      .sort({ submittedAt: -1 })
  ])
  
  if (!user) return res.status(404).json({ message: 'Student not found' })
  
  const roadmapProgress = roadmap
    ? Math.round(
        (roadmap.steps.filter(s => s.status === 'completed').length / roadmap.steps.length) * 100
      )
    : 0
  
  res.json({ user, profile, skills, reports, roadmap, evidence, roadmapProgress })
})
