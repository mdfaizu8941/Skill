import api from './api'

export const analyseGap = (payload) => api.post('/gap/analyse', payload) // payload is either { targetRole, mode: 'role' } or { jobDescription, mode: 'jd' }

export const getGapReports = () => api.get('/gap/reports')

export const getGapReport = (id) => api.get(`/gap/reports/${id}`)

export const explainGap = (payload) => api.post('/gap/explain', payload)
