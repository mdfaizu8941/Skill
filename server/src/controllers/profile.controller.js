import { asyncHandler } from '../utils/asyncHandler.js'
import User from '../models/User.js'
import StudentProfile from '../models/StudentProfile.js'
import cloudinary from '../config/cloudinary.js'
import { audit } from '../services/auditService.js'

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash -__v')
  const profile = await StudentProfile.findOne({ userId: req.user.id })
  res.json({ user, profile })
})

export const updateMe = asyncHandler(async (req, res) => {
  const { name, bio, university, enrollmentYear, graduationYear, branch, year, cgpa, expertiseAreas, linkedinUrl, availability } = req.body

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name, bio, expertiseAreas, linkedinUrl, availability },
    { new: true, runValidators: true }
  ).select('-passwordHash -__v')

  let profile = await StudentProfile.findOne({ userId: req.user.id })
  if (!profile) {
    profile = new StudentProfile({ userId: req.user.id })
  }
  if (university !== undefined) profile.university = university
  if (enrollmentYear !== undefined) profile.enrollmentYear = enrollmentYear
  if (graduationYear !== undefined) profile.graduationYear = graduationYear
  if (branch !== undefined) profile.branch = branch
  if (year !== undefined) profile.year = year
  if (cgpa !== undefined) profile.cgpa = cgpa
  await profile.save()

  await audit({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'PROFILE_UPDATED',
    targetId: req.user.id,
    targetModel: 'User',
    metadata: {
      updatedFields: Object.keys(req.body).filter(k => k !== 'passwordHash')
    },
    ip: req.ip || 'unknown'
  })

  res.json({ user, profile })
})

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' })
  }

  const user = await User.findById(req.user.id)

  if (user.avatarPublicId) {
    await cloudinary.uploader.destroy(user.avatarPublicId)
  }

  user.avatarUrl = req.file.path
  user.profilePic = req.file.path
  user.avatarPublicId = req.file.filename
  await user.save()

  await audit({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'AVATAR_UPDATED',
    targetId: req.user.id,
    targetModel: 'User',
    metadata: { avatarUrl: user.avatarUrl },
    ip: req.ip || 'unknown'
  })

  res.json({ avatarUrl: user.avatarUrl })
})

export const deleteAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
  
  if (user.avatarPublicId) {
    await cloudinary.uploader.destroy(user.avatarPublicId)
  }
  
  user.avatarUrl = ''
  user.profilePic = ''
  user.avatarPublicId = undefined
  await user.save()
  
  await audit({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'AVATAR_DELETED',
    targetId: req.user.id,
    targetModel: 'User',
    metadata: {},
    ip: req.ip || 'unknown'
  })
  
  res.json({ message: 'Avatar removed successfully' })
})

export const getById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select('-passwordHash -__v')
  if (!user) return res.status(404).json({ message: 'User not found' })
  const profile = await StudentProfile.findOne({ userId: req.params.userId })
  res.json({ user, profile })
})
