const TOKEN_KEY = 'sgip_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)

export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)

export const removeToken = () => localStorage.removeItem(TOKEN_KEY)

export const decodeToken = (token) => {
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

export const getRoleFromToken = () => {
  const token = getToken()
  const decoded = decodeToken(token)
  return decoded?.role || null
}

export const isTokenExpired = (token) => {
  const decoded = decodeToken(token)
  if (!decoded?.exp) return true
  return decoded.exp * 1000 < Date.now()
}
