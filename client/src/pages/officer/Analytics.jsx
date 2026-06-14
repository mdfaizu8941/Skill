import { motion } from 'framer-motion'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Card, { CardHeader } from '../../components/ui/Card'
import useAsync from '../../hooks/useAsync'
import api from '../../services/api'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Analytics() {
  const { data, loading, error, reload } = useAsync(async () => {
    const { data } = await api.get('/analytics/placement')
    return data || {}
  }, [])

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={reload} />

  const stats = data

  // Prepare data for bar chart
  const roleChartData = (stats.topRoles || []).map((role) => ({
    name: role._id?.slice(0, 20) || 'Unknown',
    score: Math.round(role.avgScore || 0),
    count: role.count || 0,
  }))

  // Prepare data for pie chart
  const roadmapChartData = (stats.roadmapStats || []).map((item) => ({
    name: item._id || 'Unknown',
    value: item.count || 0,
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Placement Analytics</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Visualize student performance and roadmap progress
        </p>
      </div>

      <Card>
        <CardHeader
          title="Average Scores by Role"
          subtitle="Compatibility scores for top target roles"
        />
        <div className="mt-6" style={{ width: '100%', height: 300 }}>
          {roleChartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-500 text-sm">
              No role data available
            </div>
          ) : (
            <ResponsiveContainer>
              <BarChart data={roleChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#334155' }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                <Bar dataKey="score" fill="#6366f1" name="Avg Score (%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Roadmap Status Distribution"
          subtitle="Overview of student roadmap progress"
        />
        <div className="mt-6" style={{ width: '100%', height: 300 }}>
          {roadmapChartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-500 text-sm">
              No roadmap data available
            </div>
          ) : (
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={roadmapChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roadmapChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                />
                <Legend wrapperStyle={{ color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-brand-600 dark:text-brand-400 mb-2">
            {stats.totalStudents || 0}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Active Students</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
            {stats.totalReports || 0}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Analyses</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mb-2">
            {stats.averageScore || 0}%
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Average Compatibility</div>
        </Card>
      </div>
    </motion.div>
  )
}
