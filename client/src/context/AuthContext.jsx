import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api, { extractMessage } from '../services/api'
import { getToken, setToken as saveToken, removeToken, decodeToken } from '../utils/tokenUtils'
import { normalizeRole } from '../utils/roleUtils'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getToken() || '')
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(Boolean(getToken()))

  const role = useMemo(() => {
    let rawRole = null
    if (user?.role) {
      rawRole = user.role
    } else {
      const decoded = decodeToken(token)
      rawRole = decoded?.role || null
    }
    return normalizeRole(rawRole)
  }, [token, user])

  useEffect(() => {
    let active = true

    const loadUser = async () => {
      if (!token) {
        setUser(null)
        setAuthLoading(false)
        return
      }

      try {
        const { data } = await api.get('/auth/me')
        if (active) setUser(data.user)
      } catch {
        removeToken()
        if (active) {
          setToken('')
          setUser(null)
        }
      } finally {
        if (active) setAuthLoading(false)
      }
    }

    loadUser()
    return () => {
      active = false
    }
  }, [token])

  const login = async (payload) => {
    const { data } = await api.post('/auth/login', payload)
    saveToken(data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    saveToken(data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const updateProfile = async (payload) => {
    const { data } = await api.put('/auth/me', payload)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    removeToken()
    setToken('')
    setUser(null)
  }

  const value = useMemo(
    () => ({
      token,
      user,
      role,
      authLoading,
      isAuthenticated: Boolean(token),
      login,
      register,
      updateProfile,
      logout,
    }),
    [token, user, role, authLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
