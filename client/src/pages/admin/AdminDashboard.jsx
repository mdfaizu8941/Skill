import { motion } from 'framer-motion'
import { Users, Briefcase, BarChart2, Map, ArrowLeftRight, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card, { CardHeader } from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'
import useAsync from '../../hooks/useAsync'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const formatDate = (date) => new Date(date).toLocaleString()

export default function AdminDashboard() {
  const { user } = useAuth()

  const { data, loading, error, reload } = useAsync(async () => {
    const res = await api.get('/admin/stats')
    return res.data
  }, [])

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={reload} />

  const stats = data || {}

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-100">
          Welcome back, {user?.name?.split(' ')[0] || 'Admin'} 👋
        </h1>
        <p className="text-slate-400 mt-1">Platform overview and management.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers ?? 0} icon={Users} tone="brand" />
        <StatCard title="Active Exchanges" value={stats.activeExchanges ?? 0} icon={ArrowLeftRight} tone="amber" />
        <StatCard title="Career Roles" value={stats.totalCareerRoles ?? 0} icon={Briefcase} tone="emerald" />
        <StatCard title="Gap Reports" value={stats.totalGapReports ?? 0} icon={BarChart2} tone="rose" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Students" value={stats.totalStudents ?? 0} icon={Users} tone="brand" />
        <StatCard title="Mentors" value={stats.totalMentors ?? 0} icon={Users} tone="teal" />
        <StatCard title="Officers" value={stats.totalOfficers ?? 0} icon={Shield} tone="amber" />
        <StatCard title="Active Roadmaps" value={stats.totalRoadmaps ?? 0} icon={Map} tone="emerald" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card noPadding>
          <div className="p-6">
            <CardHeader title="Recent Audit Logs" subtitle="Latest system and user actions" />
            <div className="space-y-3 mt-4">
              {stats.recentLogs?.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">No audit logs yet.</p>
              ) : (
                stats.recentLogs?.map((log, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-800 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-brand-400 mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-300">
                          {log.actorId?.name || 'System'}
                        </span>
                        <Badge variant="info">{log.action}</Badge>
                        <span className="text-xs text-slate-500">{log.actorRole}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{formatDate(log.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link to="/admin/audit-logs" className="text-xs text-brand-400 hover:underline mt-4 block">
              View all audit logs →
            </Link>
          </div>
        </Card>

        <Card noPadding>
          <div className="p-6">
            <CardHeader title="Quick Actions" subtitle="Common admin tasks" />
            <div className="space-y-3 mt-4">
              <Link to="/admin/users" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors">
                <Users className="w-5 h-5 text-brand-400" />
                <span className="text-sm text-slate-300">Manage Users</span>
              </Link>
              <Link to="/admin/role-catalog" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors">
                <Briefcase className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-slate-300">Manage Career Roles</span>
              </Link>
              <Link to="/admin/audit-logs" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors">
                <Shield className="w-5 h-5 text-amber-400" />
                <span className="text-sm text-slate-300">View Audit Logs</span>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  )
}