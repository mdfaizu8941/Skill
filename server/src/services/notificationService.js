import Notification from '../models/Notification.js'

export const createNotification = async ({ recipientId, type, title, message, link = '' }) => {
  try {
    await Notification.create({ recipientId, type, title, message, link })
  } catch (err) {
    console.error('Notification creation failed:', err.message)
  }
}
