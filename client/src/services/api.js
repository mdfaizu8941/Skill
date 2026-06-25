import axios from 'axios'
import toast from 'react-hot-toast'
import { getToken, removeToken } from '../utils/tokenUtils'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || ''

    if (status === 401) {
      removeToken()
      window.location.href = '/login'
    }

    // Session revocation: deactivated account
    if (status === 403 && message.toLowerCase().includes('deactivated')) {
      removeToken()
      toast.error('Your account has been deactivated. Please contact an administrator.')
      error._handled = true
      window.location.href = '/login'
    }

    // Rate limiting
    if (status === 429) {
      const retryAfter = error.response?.data?.retryAfter
      const minutes = retryAfter ? Math.ceil(retryAfter / 60) : null
      const timeMsg = minutes ? ` Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.` : ''
      toast.error(message || `Too many requests.${timeMsg}`)
      error._handled = true
    }

    return Promise.reject(error)
  }
)

export const extractMessage = (error) =>
  error?._handled ? null : (error?.response?.data?.message || error?.message || 'Something went wrong')

/** Show a toast error only if the error wasn't already handled by the interceptor */
export const showError = (error) => {
  const msg = extractMessage(error)
  if (msg) toast.error(msg)
}

export default api

