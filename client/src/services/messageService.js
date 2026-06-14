import api from './api'

export const getConversations = () => api.get('/messages/conversations')

export const createConversation = (peerId) => api.post('/messages/conversations', { peerId })

export const markRead = (otherUserId) => api.patch(`/messages/conversations/${otherUserId}/read`)

export const getMessages = (otherUserId) => api.get('/messages', { params: { otherUserId } })

export const sendMessage = (payload) => api.post('/messages', payload)

export const searchUsers = (q) => api.get('/messages/users/search', { params: { q } })
