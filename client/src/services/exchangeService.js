import api from './api'

export const getExchanges = () => api.get('/exchanges')

export const createExchange = (payload) => api.post('/exchanges', payload)

export const updateExchangeStatus = (id, payload) => api.patch(`/exchanges/${id}`, payload)
