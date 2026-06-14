import api from './api'

export const getRatings = () => api.get('/ratings')

export const getRateableExchanges = () => api.get('/ratings/rateable-exchanges')

export const submitRating = (payload) => api.post('/ratings', payload)
