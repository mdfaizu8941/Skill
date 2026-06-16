import api from './api'

export const getOfficerDashboard = () => api.get('/officer/dashboard')

export const getOfficerStudents = (params = {}) => api.get('/officer/students', { params })

export const exportOfficerStudents = (params = {}) =>
  api.get('/officer/students/export', { params, responseType: 'blob' })

export const updateOfficerStudentProfile = (studentId, payload) =>
  api.patch(`/officer/students/${studentId}/profile`, payload)

export const getOfficerMentors = () => api.get('/officer/mentors')

export const assignOfficerMentor = (payload) => api.post('/officer/mentors/assign', payload)

export const getOfficerOpportunities = (params = {}) => api.get('/officer/opportunities', { params })

export const createOfficerOpportunity = (payload) => api.post('/officer/opportunities', payload)

export const updateOfficerOpportunity = (id, payload) => api.patch(`/officer/opportunities/${id}`, payload)

export const deleteOfficerOpportunity = (id) => api.delete(`/officer/opportunities/${id}`)

export const trackOfficerApplication = (id, payload) => api.post(`/officer/opportunities/${id}/applications`, payload)

export const getOfficerCriteria = () => api.get('/officer/eligibility-criteria')

export const createOfficerCriteria = (payload) => api.post('/officer/eligibility-criteria', payload)

export const updateOfficerCriteria = (id, payload) => api.patch(`/officer/eligibility-criteria/${id}`, payload)

export const deleteOfficerCriteria = (id) => api.delete(`/officer/eligibility-criteria/${id}`)

export const checkOfficerEligibility = (payload) => api.post('/officer/eligibility/check', payload)

export const getOfficerAnnouncements = (params = {}) => api.get('/officer/announcements', { params })

export const sendOfficerAnnouncement = (payload) => api.post('/officer/announcements', payload)

export const getOfficerReports = () => api.get('/officer/reports')

export const downloadOfficerReport = (type, format = 'csv') =>
  api.get('/officer/reports/download', { params: { type, format }, responseType: 'blob' })

export const getOfficerActivityLogs = (params = {}) => api.get('/officer/activity-logs', { params })
