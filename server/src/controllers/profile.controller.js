import { asyncHandler } from '../utils/asyncHandler.js'
import User from '../models/User.js'
import StudentProfile from '../models/StudentProfile.js'
import cloudinary from '../config/cloudinary.js'

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash -__v')
  const profile = await StudentProfile.findOne({ userId: req.user.id })
  res.json({ user, profile })
})

export const updateMe = asyncHandler(async (req, res) => {
  const { name, bio, university, enrollmentYear, graduationYear, expertiseAreas, linkedinUrl, availability } = req.body

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
  await profile.save()

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
  user.avatarPublicId = req.file.filename
  await user.save()

  res.json({ avatarUrl: user.avatarUrl })
})

export const getById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select('-passwordHash -__v')
  if (!user) return res.status(404).json({ message: 'User not found' })
  const profile = await StudentProfile.findOne({ userId: req.params.userId })
  res.json({ user, profile })
})
