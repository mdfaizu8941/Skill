import api from './api'

export const getMyEvidence = () => api.get('/evidence/my')
export const submitEvidence = (data) => api.post('/evidence', data)
export const getPendingEvidence = () => api.get('/evidence/pending')
export const reviewEvidence = (id, data) => api.patch(`/evidence/${id}/review`, data)
