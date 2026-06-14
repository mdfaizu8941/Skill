import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Clock } from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Loader from '../../components/common/Loader'

export default function Notifications() {
  const navigate = useNavigate()
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications()

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(date).toLocaleDateString()
  }

  const groupNotifications = () => {
    const today = []
    const yesterday = []
    const earlier = []

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)

    notifications.forEach((notif) => {
      const notifDate = new Date(notif.createdAt)
      if (notifDate >= todayStart) {
        today.push(notif)
      } else if (notifDate >= yesterdayStart) {
        yesterday.push(notif)
      } else {
        earlier.push(notif)
      }
    })

    return { today, yesterday, earlier }
  }

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      markAsRead(notif._id)
    }
    if (notif.link) {
      navigate(notif.link)
    }
  }

  const { today, yesterday, earlier } = groupNotifications()

  if (loading && notifications.length === 0) return <Loader />

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Notifications</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="secondary" onClick={markAllAsRead}>
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-2">
            You're all caught up
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            No notifications yet. We'll let you know when something happens.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {today.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Today</h2>
              <div className="space-y-2">
                {today.map((notif) => (
                  <Card
                    key={notif._id}
                    className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      !notif.isRead ? 'border-l-4 border-l-purple-500' : ''
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-2 rounded-lg ${
                          notif.type === 'EVIDENCE_APPROVED'
                            ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                            : notif.type === 'EVIDENCE_REJECTED'
                            ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                            : 'bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400'
                        }`}
                      >
                        <Bell className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-slate-900 dark:text-slate-100">
                            {notif.title}
                          </h3>
                          {!notif.isRead && (
                            <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-2" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-500 dark:text-slate-500">
                            {getTimeAgo(notif.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {yesterday.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                Yesterday
              </h2>
              <div className="space-y-2">
                {yesterday.map((notif) => (
                  <Card
                    key={notif._id}
                    className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      !notif.isRead ? 'border-l-4 border-l-purple-500' : ''
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-2 rounded-lg ${
                          notif.type === 'EVIDENCE_APPROVED'
                            ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                            : notif.type === 'EVIDENCE_REJECTED'
                            ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                            : 'bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400'
                        }`}
                      >
                        <Bell className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-slate-900 dark:text-slate-100">
                            {notif.title}
                          </h3>
                          {!notif.isRead && (
                            <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-2" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-500 dark:text-slate-500">
                            {getTimeAgo(notif.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {earlier.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Earlier</h2>
              <div className="space-y-2">
                {earlier.map((notif) => (
                  <Card
                    key={notif._id}
                    className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      !notif.isRead ? 'border-l-4 border-l-purple-500' : ''
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-2 rounded-lg ${
                          notif.type === 'EVIDENCE_APPROVED'
                            ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                            : notif.type === 'EVIDENCE_REJECTED'
                            ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                            : 'bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400'
                        }`}
                      >
                        <Bell className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-slate-900 dark:text-slate-100">
                            {notif.title}
                          </h3>
                          {!notif.isRead && (
                            <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-2" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-500 dark:text-slate-500">
                            {getTimeAgo(notif.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
