import { motion } from 'framer-motion'
import { BookOpen, Target, Route, ClipboardList, ArrowRight, MessageSquare, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import StatCard from '../../components/ui/StatCard'
import Card, { CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'
import useAsync from '../../hooks/useAsync'
import api from '../../services/api'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'

export default function StudentDashboard() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useAsync(async () => {
    const [summaryRes, reportsRes, roadmapRes] = await Promise.allSettled([
      api.get('/analytics/summary'),
      api.get('/gap/reports'),
      api.get('/roadmap/my'),
    ])

    const summary = summaryRes.status === 'fulfilled' ? summaryRes.value.data.summary : {}
    const reports = reportsRes.status === 'fulfilled' ? reportsRes.value.data.reports : []
    const roadmap = roadmapRes.status === 'fulfilled' ? roadmapRes.value.data.roadmaps?.[0] : null

    // Calculate gap score from latest report
    const latestReport = reports?.length > 0 ? reports[0] : null
    const gapScore = latestReport ? latestReport.compatibilityScore : 0

    // Calculate roadmap progress
    let roadmapProgress = 0
    if (roadmap?.steps?.length > 0) {
      const completed = roadmap.steps.filter(s => s.status === 'completed').length
      roadmapProgress = Math.round((completed / roadmap.steps.length) * 100)
    }

    return { ...summary, gapScore, roadmapProgress, reports }
  }, [])

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={reload} />

  const summary = data || {}

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
          Welcome back, {user?.name?.split(' ')[0] || 'Student'} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Here&apos;s your career readiness overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Skills Added" value={summary.skills || 0} icon={BookOpen} tone="brand" />
        <StatCard title="Gap Match Score" value={`${summary.gapScore || 0}%`} icon={Target} tone="amber" />
        <StatCard title="Roadmap Progress" value={`${summary.roadmapProgress || 0}%`} icon={Route} tone="emerald" />
        <StatCard title="Unread Messages" value={summary.unreadMessages || 0} icon={MessageSquare} tone="rose" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card noPadding>
          <div className="p-6">
            <CardHeader title="Recent Gap Reports" subtitle="Your latest skill assessments" />
            <div className="space-y-3 mt-4">
              {(summary.reports || []).slice(0, 3).length > 0 ? (
                summary.reports.slice(0, 3).map((report, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="w-2 h-2 mt-2 rounded-full bg-brand-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-300">Target: {report.targetRole || 'Unknown Role'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">Match Score: {report.compatibilityScore?.toFixed(1)}%</p> 
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No recent gap reports yet. Start by running an analysis!</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="flex flex-col items-center justify-center text-center py-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Run Gap Analysis</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
            Compare your skills against your target role to identify exactly what you need to learn.
          </p>
          <Link to="/student/gap-analysis">
            <Button>
              Start Analysis <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </Card>
      </div>
    </motion.div>
  )
}
