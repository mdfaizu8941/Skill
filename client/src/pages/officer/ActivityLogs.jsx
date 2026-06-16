import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ScrollText, Search } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'
import { getOfficerActivityLogs } from '../../services/officerService'
import { extractMessage } from '../../services/api'

export default function ActivityLogs() {
  const [logs, setLogs] = useState([])
  const [action, setAction] = useState('')
  const [appliedAction, setAppliedAction] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await getOfficerActivityLogs({ action: appliedAction, limit: 50 })
      setLogs(data.logs || [])
    } catch (err) {
      setError(extractMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [appliedAction])

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={load} />

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Activity Logs</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Track officer opportunity, communication, mentor assignment, and report actions.</p>
      </div>

      <Card>
        <form onSubmit={(e) => { e.preventDefault(); setAppliedAction(action) }} className="flex flex-col sm:flex-row gap-3">
          <Input value={action} onChange={(e) => setAction(e.target.value)} placeholder="Filter by action" />
          <Button type="submit"><Search className="w-4 h-4" /> Filter</Button>
        </form>
      </Card>

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-500 bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left font-medium">Action</th>
                <th className="px-6 py-4 text-left font-medium">Officer</th>
                <th className="px-6 py-4 text-left font-medium">Target</th>
                <th className="px-6 py-4 text-left font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="px-6 py-4"><Badge variant="brand">{log.action}</Badge></td>
                  <td className="px-6 py-4"><p className="font-medium">{log.actorId?.name || 'Officer'}</p><p className="text-xs text-slate-500">{log.actorId?.email || ''}</p></td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{log.targetModel || '-'} {log.targetId ? `- ${log.targetId}` : ''}</td>
                  <td className="px-6 py-4 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={4} className="px-6 py-14 text-center text-slate-500"><ScrollText className="w-10 h-10 mx-auto mb-2 opacity-40" />No logs found.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  )
}
