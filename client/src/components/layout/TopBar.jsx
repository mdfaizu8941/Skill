import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, Bell, LogOut, User, Settings, CheckCheck, Clock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { getRoleLabel, getRoleColor } from '../../utils/roleUtils'

export default function TopBar({ onMenuClick }) {
  const { user, role, logout } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const notifDropdownRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setNotifDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      markAsRead(notif._id)
    }
    setNotifDropdownOpen(false)
    if (notif.link) {
      navigate(notif.link)
    }
  }

  const recentNotifications = notifications.slice(0, 5)

  return (
    <header className="sticky top-0 z-20 h-16 flex items-center justify-between px-4 md:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md transition-colors duration-200">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/" className="text-lg font-bold bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent lg:hidden">
          Skill Gap Intelligence
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification Dropdown */}
        <div className="relative" ref={notifDropdownRef}>
          <button
            type="button"
            onClick={() => setNotifDropdownOpen((prev) => !prev)}
            className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-96 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl py-1 z-50 max-h-[500px] overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-slate-200">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className="overflow-y-auto max-h-[400px]">
                {recentNotifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">No notifications</p>
                  </div>
                ) : (
                  <div className="py-1">
                    {recentNotifications.map((notif) => (
                      <button
                        key={notif._id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                          !notif.isRead ? 'border-l-4 border-l-purple-500 bg-purple-50/50 dark:bg-purple-500/5' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {!notif.isRead && (
                            <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-2" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-1">
                              {notif.title}
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                              {notif.message.slice(0, 60)}
                              {notif.message.length > 60 ? '...' : ''}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span className="text-xs text-slate-500 dark:text-slate-500">
                                {getTimeAgo(notif.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {recentNotifications.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2">
                  <button
                    onClick={() => {
                      setNotifDropdownOpen(false)
                      navigate(`/${role === 'Student' ? 'student' : role === 'Mentor' ? 'mentor' : role === 'PlacementOfficer' ? 'officer' : 'admin'}/notifications`)
                    }}
                    className="text-sm text-brand-600 dark:text-brand-400 hover:underline w-full text-center"
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {role && (
          <span className={`hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRoleColor(role)}`}>
            {getRoleLabel(role)}
          </span>
        )}

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
              {user?.avatarUrl || user?.profilePic ? (
                <img src={user.avatarUrl || user.profilePic} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl py-1 z-50">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-500">{user?.email || ''}</p>
              </div>
              <button
                type="button"
                onClick={() => { setDropdownOpen(false); navigate(`/${role === 'Student' ? 'student' : role === 'Mentor' ? 'mentor' : role === 'PlacementOfficer' ? 'officer' : 'admin'}/dashboard`); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <User className="w-4 h-4" /> Profile
              </button>
              <button
                type="button"
                onClick={() => { setDropdownOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
              <div className="border-t border-slate-100 dark:border-slate-800" />
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
