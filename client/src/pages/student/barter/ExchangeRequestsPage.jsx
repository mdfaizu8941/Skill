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

const normalizeStatus = (s) => String(s || '').toLowerCase()
const formatStatus = (s) => s[0].toUpperCase() + s.slice(1)

export default function ExchangeRequestsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, loading, error, reload, setError } = useAsync(async () => {
    const { data } = await api.get('/exchanges')
    return data.exchanges || []
  }, [])

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/exchanges/${id}`, { status })
      reload()
    } catch (err) { setError(extractMessage(err)) }
  }

  const messageUser = async (targetUser) => {
    const peerId = targetUser?._id || targetUser?.id || targetUser
    if (!peerId) return
    try {
      await api.post('/messages/conversations', { peerId })
      navigate('/student/barter/chat', { state: { peerId } })
    } catch (err) { setError(extractMessage(err)) }
  }

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={reload} />

  const currentUserId = user?._id || user?.id
  const exchanges = data || []
  const groups = ['pending', 'accepted', 'rejected']
  const statusVariant = { pending: 'warning', accepted: 'success', rejected: 'danger' }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Exchange Requests</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        {groups.map((status) => {
          const items = exchanges.filter((e) => normalizeStatus(e.status) === status)
          return (
            <div key={status} className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-200">{formatStatus(status)}</h2>
              {items.length === 0 && <Card className="text-center py-6 text-sm text-slate-500">No {status} requests.</Card>}
              {items.map((exchange) => {
                const st = normalizeStatus(exchange.status)
                const senderId = exchange.senderId || (exchange.sender?._id || exchange.sender?.id || exchange.sender)
                const receiverId = exchange.receiverId || (exchange.receiver?._id || exchange.receiver?.id || exchange.receiver)
                const canDecide = currentUserId === receiverId && st === 'pending'
                const peer = currentUserId === senderId ? exchange.receiver : exchange.sender
                const canMessage = st === 'accepted' && (peer?._id || peer?.id || peer)
                return (
                  <Card key={exchange._id}>
                    <div className="flex items-start justify-between mb-2"><strong className="text-slate-100">{exchange.skillOffered}</strong><Badge variant={statusVariant[st]}>{formatStatus(st)}</Badge></div>
                    <p className="text-sm text-slate-400">Wants <strong>{exchange.skillWanted}</strong></p>
                    {exchange.note && <p className="text-sm text-slate-400 mt-1">{exchange.note}</p>}
                    <div className="text-xs text-slate-500 mt-2 space-y-0.5"><p>From: {exchange.sender?.name || 'sender'}</p><p>To: {exchange.receiver?.name || 'receiver'}</p></div>
                    {canDecide && <div className="flex gap-2 mt-3"><Button size="sm" onClick={() => updateStatus(exchange._id, 'accepted')}>Accept</Button><Button size="sm" variant="ghost" onClick={() => updateStatus(exchange._id, 'rejected')}>Reject</Button></div>}
                    {canMessage && <div className="mt-3"><Button size="sm" variant="ghost" onClick={() => messageUser(peer)}>Message User</Button></div>}
                  </Card>
                )
              })}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
