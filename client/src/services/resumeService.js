import api from './api'

export const parseResume = (file) => {
  const formData = new FormData()
  formData.append('resume', file)
  return api.post('/resume/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
