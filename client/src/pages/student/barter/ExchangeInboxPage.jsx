import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import api, { extractMessage } from '../../../services/api'
import useAsync from '../../../hooks/useAsync'
import { useAuth } from '../../../context/AuthContext'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Loader from '../../../components/common/Loader'
import ErrorMessage from '../../../components/common/ErrorMessage'

const toId = (v) => { if (!v) return ''; if (v._id) return v._id; if (v.id) return v.id; return v }

export default function ExchangeInboxPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, loading, error, reload, setError } = useAsync(async () => {
    const { data } = await api.get('/exchanges')
    return data.exchanges || []
  }, [])

  const updateStatus = async (id, status) => {
    try { await api.patch(`/exchanges/${id}`, { status }); reload() }
    catch (err) { setError(extractMessage(err)) }
  }

  const messageUser = async (targetUser) => {
    const peerId = targetUser?._id || targetUser?.id || targetUser
    if (!peerId) return
    try { await api.post('/messages/conversations', { peerId }); navigate('/student/barter/chat', { state: { peerId } }) }
    catch (err) { setError(extractMessage(err)) }
  }

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={reload} />

  const currentUserId = user?._id || user?.id
  const inbox = (data || []).filter((e) => { const rid = e.receiverId || toId(e.receiver); return rid === currentUserId })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Exchange Inbox</h1>
      {inbox.length === 0 && <Card className="text-center py-12 text-slate-400">No incoming exchange requests yet.</Card>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {inbox.map((exchange) => {
          const st = String(exchange.status || '').toLowerCase()
          const canDecide = st === 'pending'
          const peer = exchange.sender
          const canMessage = st === 'accepted' && toId(peer)
          return (
            <Card key={exchange._id}>
              <div className="flex items-start justify-between mb-2"><strong className="text-slate-100">{exchange.skillOffered}</strong><Badge variant={st === 'accepted' ? 'success' : st === 'rejected' ? 'danger' : 'warning'}>{st[0].toUpperCase() + st.slice(1)}</Badge></div>
              <p className="text-sm text-slate-400">Wants <strong>{exchange.skillWanted}</strong></p>
              {exchange.note && <p className="text-sm text-slate-400 mt-1">{exchange.note}</p>}
              <p className="text-xs text-slate-500 mt-2">From: {exchange.sender?.name || 'sender'}</p>
              {canDecide && <div className="flex gap-2 mt-3"><Button size="sm" onClick={() => updateStatus(exchange._id, 'accepted')}>Accept</Button><Button size="sm" variant="ghost" onClick={() => updateStatus(exchange._id, 'rejected')}>Reject</Button></div>}
              {canMessage && <div className="mt-3"><Button size="sm" variant="ghost" onClick={() => messageUser(peer)}>Message User</Button></div>}
            </Card>
          )
        })}
      </div>
    </motion.div>
  )
}
