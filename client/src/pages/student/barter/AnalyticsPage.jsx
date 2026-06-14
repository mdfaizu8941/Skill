import { motion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import api from '../../../services/api'
import useAsync from '../../../hooks/useAsync'
import Card, { CardHeader } from '../../../components/ui/Card'
import StatCard from '../../../components/ui/StatCard'
import { BookOpen, Mail, Star, Award } from 'lucide-react'
import Loader from '../../../components/common/Loader'
import ErrorMessage from '../../../components/common/ErrorMessage'

const colors = ['#818cf8', '#14b8a6', '#fbbf24', '#f472b6', '#a78bfa', '#34d399']
const formatStatus = (s) => s[0].toUpperCase() + s.slice(1)

export default function AnalyticsPage() {
  const { data, loading, error, reload } = useAsync(async () => {
    const [skillsRes, exchangesRes, summaryRes] = await Promise.all([api.get('/skills'), api.get('/exchanges'), api.get('/analytics/summary')])
    return { skills: skillsRes.data.skills || [], exchanges: exchangesRes.data.exchanges || [], summary: summaryRes.data.summary }
  }, [])

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={reload} />

  const skills = data?.skills || []
  const summary = data?.summary || {}
  const catData = Object.entries(skills.reduce((m, s) => { const k = s.category || 'Other'; m[k] = (m[k] || 0) + 1; return m }, {})).map(([name, value]) => ({ name, value }))
  const exData = ['pending', 'accepted', 'rejected'].map((s) => ({ name: formatStatus(s), value: summary.exchanges?.[s] || 0 }))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Barter Analytics</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Your Skills" value={summary.skills || 0} icon={BookOpen} tone="brand" />
        <StatCard label="Unread Messages" value={summary.unreadMessages || 0} icon={Mail} tone="sky" />
        <StatCard label="Rating Average" value={`${summary.rating?.average || 0}/5`} icon={Star} tone="amber" />
        <StatCard label="Badges" value={summary.badges?.length || 0} icon={Award} tone="rose" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Skill Categories" />
          <ResponsiveContainer width="100%" height={280}>
            <PieChart><Pie data={catData} dataKey="value" nameKey="name" outerRadius={92} innerRadius={52} paddingAngle={3}>{catData.map((e, i) => <Cell key={e.name} fill={colors[i % colors.length]} />)}</Pie><Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} /><Legend /></PieChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <CardHeader title="Exchange Status" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={exData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="name" stroke="#94a3b8" /><YAxis allowDecimals={false} stroke="#94a3b8" /><Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} /><Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#818cf8" /></BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </motion.div>
  )
}
