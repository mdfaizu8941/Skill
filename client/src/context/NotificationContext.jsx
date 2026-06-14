import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications')
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }, [])

  const markAsRead = useCallback(async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }, [])

  const reload = useCallback(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Fetch on mount and poll every 30 seconds - ONLY if user is authenticated
  useEffect(() => {
    if (!user) {
      // Clear notifications when logged out
      setNotifications([])
      setUnreadCount(0)
      return
    }

    // Fetch immediately on login
    fetchNotifications()
    
    // Set up polling interval
    const interval = setInterval(fetchNotifications, 30000)
    
    // Clear interval on logout or unmount
    return () => clearInterval(interval)
  }, [user, fetchNotifications])

  const value = useMemo(
    () => ({ notifications, unreadCount, loading, markAsRead, markAllAsRead, reload }),
    [notifications, unreadCount, loading, markAsRead, markAllAsRead, reload]
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export const useNotifications = () => useContext(NotificationContext)
