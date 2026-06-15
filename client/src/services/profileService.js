import api from './api'

export const getMyProfile = () => api.get('/profile/me')

export const updateMyProfile = (data) => api.put('/profile/me', data)

export const uploadAvatar = (formData) => api.put('/profile/me/avatar', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})

export const deleteAvatar = () => api.delete('/profile/me/avatar')
