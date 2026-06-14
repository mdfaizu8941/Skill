import { motion } from 'framer-motion'
import { Users, UserCheck, FileText, TrendingUp } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import Card, { CardHeader } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { useAuth } from '../../context/AuthContext'
import useAsync from '../../hooks/useAsync'
import api from '../../services/api'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'

export default function OfficerDashboard() {
  const { user } = useAuth()
  
  const { data, loading, error, reload } = useAsync(async () => {
    const { data } = await api.get('/analytics/placement')
    return data || {}
  }, [])

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={reload} />

  const stats = data

  const getScoreBadgeVariant = (score) => {
    if (score >= 70) return 'success'
    if (score >= 40) return 'warning'
    return 'danger'
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Welcome back, {user?.name?.split(' ')[0] || 'Officer'} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Placement overview and student readiness.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats.totalStudents || 0} icon={Users} tone="brand" />
        <StatCard title="Total Mentors" value={stats.totalMentors || 0} icon={UserCheck} tone="emerald" />
        <StatCard title="Gap Reports" value={stats.totalReports || 0} icon={FileText} tone="amber" />
        <StatCard title="Avg. Score" value={`${stats.averageScore || 0}%`} icon={TrendingUp} tone="cyan" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Top Analysed Roles" subtitle="Most popular target roles" />
          {(stats.topRoles || []).length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-500 text-sm">
              No role data yet
            </div>
          ) : (
            <div className="mt-4">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="pb-2 font-medium">Role</th>
                    <th className="pb-2 font-medium text-center">Analysed</th>
                    <th className="pb-2 font-medium text-right">Avg Score</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {stats.topRoles.slice(0, 5).map((role, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <td className="py-3 text-slate-900 dark:text-slate-200 font-medium">
                        {role._id || 'Unknown'}
                      </td>
                      <td className="py-3 text-center text-slate-600 dark:text-slate-400">
                        {role.count}
                      </td>
                      <td className="py-3 text-right">
                        <Badge variant={getScoreBadgeVariant(role.avgScore)}>
                          {Math.round(role.avgScore)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Recent Gap Reports" subtitle="Latest student analyses" />
          {(stats.recentReports || []).length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-500 text-sm">
              No reports yet
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {stats.recentReports.slice(0, 10).map((report) => (
                <div
                  key={report._id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">
                      {report.studentId?.name || 'Unknown Student'}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {report.targetRole || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={getScoreBadgeVariant(report.compatibilityScore)}>
                      {report.compatibilityScore}%
                    </Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-500">
                      {new Date(report.generatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  )
}
