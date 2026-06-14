import api from './api'

export const getSkills = (params) => api.get('/skills', { params })

export const getMySkills = () => api.get('/skills/mine')

export const getSkillById = (id) => api.get(`/skills/${id}`)

export const createSkill = (payload) => api.post('/skills', payload)

export const updateSkill = (id, payload) => api.put(`/skills/${id}`, payload)

export const deleteSkill = (id) => api.delete(`/skills/${id}`)
