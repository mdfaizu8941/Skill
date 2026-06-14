import { motion } from 'framer-motion'
import { Users, ClipboardCheck, Clock, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'
import useAsync from '../../hooks/useAsync'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export default function MentorDashboard() {
  const { user } = useAuth()

  const { data, loading, error, reload } = useAsync(async () => {
    const [studentsRes, evidenceRes, reviewedRes, requestsRes] = await Promise.allSettled([
      api.get('/mentor/students'),
      api.get('/evidence/pending'),
      api.get('/evidence/reviewed'),
      api.get('/mentor/requests/incoming'),
    ])
    const students = studentsRes.status === 'fulfilled' ? studentsRes.value.data.students || [] : []
    const pending = evidenceRes.status === 'fulfilled' ? evidenceRes.value.data.evidence || [] : []
    const reviewed = reviewedRes.status === 'fulfilled' ? reviewedRes.value.data.evidence || [] : []
    const requests = requestsRes.status === 'fulfilled' ? requestsRes.value.data.requests || [] : []
    const pendingRequests = requests.filter((r) => r.status === 'pending')
    return { students, pending, reviewed, pendingRequests }
  }, [])

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={reload} />

  const { students = [], pending = [], reviewed = [], pendingRequests = [] } = data || {}

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Welcome, {user?.name?.split(' ')[0] || 'Mentor'} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Here's your mentorship overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Assigned Students" value={students.length} icon={Users} tone="brand" />
        <StatCard title="Pending Reviews" value={pending.length} icon={Clock} tone="amber" />
        <StatCard title="Completed Reviews" value={reviewed.length} icon={ClipboardCheck} tone="emerald" />
        <StatCard title="Connection Requests" value={pendingRequests.length} icon={UserPlus} tone="purple" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card noPadding>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-200 mb-4">Assigned Students</h2>
            {students.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-500 text-sm text-center py-8">No students assigned yet.</p>
            ) : (
              <div className="space-y-3">
                {students.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-200 dark:border-slate-800 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                      {item.user?.name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-300">{item.user?.name}</p>
                      <p className="text-xs text-slate-500">{item.user?.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to="/mentor/students" className="text-xs text-brand-600 dark:text-brand-400 hover:underline mt-4 block">
              View all students →
            </Link>
          </div>
        </Card>

        <Card noPadding>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-200 mb-4">Pending Evidence Reviews</h2>
            {pending.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-500 text-sm text-center py-8">No pending reviews.</p>
            ) : (
              <div className="space-y-3">
                {pending.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-200 dark:border-slate-800 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-300">{item.skillId?.skillName || 'Unknown Skill'}</p>
                      <p className="text-xs text-slate-500">{item.studentId?.name || 'Student'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to="/mentor/evidence-review" className="text-xs text-brand-600 dark:text-brand-400 hover:underline mt-4 block">
              Review all evidence →
            </Link>
          </div>
        </Card>

        {pendingRequests.length > 0 && (
          <Card noPadding className="lg:col-span-2">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-200 mb-4">New Connection Requests</h2>
              <div className="space-y-3">
                {pendingRequests.slice(0, 3).map((req, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                        {req.studentId?.name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{req.studentId?.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{req.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/mentor/requests" className="text-xs text-brand-600 dark:text-brand-400 hover:underline mt-4 block">
                View all requests →
              </Link>
            </div>
          </Card>
        )}
      </div>
    </motion.div>
  )
}