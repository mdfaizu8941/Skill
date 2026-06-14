import api from './api'

export const generateRoadmap = (payload) => api.post('/roadmap/generate', payload)

export const getRoadmap = () => api.get('/roadmap/my')

export const updateMilestone = (id, payload) => api.patch(`/roadmap/steps/${id}`, payload)
