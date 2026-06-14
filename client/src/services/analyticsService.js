import api from './api'

export const getSummary = () => api.get('/analytics/summary')

export const getPlacementAnalytics = () => api.get('/analytics/placement')

export const getStudentAnalytics = (studentId) => api.get(`/analytics/student/${studentId}`)
