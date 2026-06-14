import { asyncHandler } from '../utils/asyncHandler.js'
import Notification from '../models/Notification.js'

export const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipientId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(20)
  const unreadCount = await Notification.countDocuments({
    recipientId: req.user.id,
    isRead: false
  })
  res.json({ notifications, unreadCount })
})

export const markAsRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipientId: req.user.id },
    { isRead: true }
  )
  res.json({ success: true })
})

export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipientId: req.user.id, isRead: false },
    { isRead: true }
  )
  res.json({ success: true })
})
