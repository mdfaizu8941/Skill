import { createRequire } from 'module'
import cloudinary from './cloudinary.js'

const require = createRequire(import.meta.url)
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer = require('multer')

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'sgip/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  },
})

const resumeStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'sgip/resumes',
    allowed_formats: ['pdf'],
    resource_type: 'raw',
  },
})

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
})

export const uploadResume = multer({
  storage: resumeStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
})
