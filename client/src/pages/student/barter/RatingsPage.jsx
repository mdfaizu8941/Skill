import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { extractMessage } from '../../../services/api'
import useAsync from '../../../hooks/useAsync'
import { useAuth } from '../../../context/AuthContext'
import Card, { CardHeader } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import StatCard from '../../../components/ui/StatCard'
import Loader from '../../../components/common/Loader'
import ErrorMessage from '../../../components/common/ErrorMessage'

const toId = (v) => { if (!v) return ''; if (v._id) return v._id; if (v.id) return v.id; return v }
const getPeer = (ex, uid) => { if (ex.peer) return ex.peer; return toId(ex.sender) === uid ? ex.receiver : ex.sender }

export default function RatingsPage() {
  const { user } = useAuth()
  const currentUserId = user?._id || user?.id
  const [selectedExchange, setSelectedExchange] = useState(null)
  const [form, setForm] = useState({ stars: 5, feedback: '' })

  const { data, loading, error, reload, setError } = useAsync(async () => {
    const [ratingsRes, summaryRes, exchangesRes] = await Promise.all([api.get('/ratings'), api.get('/analytics/summary'), api.get('/ratings/rateable-exchanges')])
    return { ratings: ratingsRes.data.ratings || [], summary: summaryRes.data.summary, exchanges: exchangesRes.data.exchanges || [] }
  }, [])

  const submit = async (e) => {
    e.preventDefault(); if (!selectedExchange) return
    try {
      await api.post('/ratings', { exchangeId: selectedExchange._id, stars: Number(form.stars), feedback: form.feedback })
      setSelectedExchange(null); setForm({ stars: 5, feedback: '' }); toast.success('Rating submitted!'); reload()
    } catch (err) { toast.error(extractMessage(err)) }
  }

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={reload} />

  const ratings = data?.ratings || []
  const received = ratings.filter((r) => toId(r.reviewee) === currentUserId)
  const sent = ratings.filter((r) => toId(r.reviewer) === currentUserId)
  const exchanges = data?.exchanges || []
  const selectedPeer = selectedExchange ? getPeer(selectedExchange, currentUserId) : null

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Ratings & Feedback</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Average Rating" value={`${data?.summary?.rating?.average || 0}/5`} icon={Star} tone="amber" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Accepted Exchanges" subtitle="Choose an exchange and rate the peer." />
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {exchanges.map((ex) => { const peer = getPeer(ex, currentUserId); const active = selectedExchange?._id === ex._id; return (
              <div key={ex._id} className={`p-3 rounded-lg border transition-colors cursor-pointer ${active ? 'border-brand-500 bg-brand-500/10' : 'border-slate-800 hover:border-slate-700'}`} onClick={() => { setSelectedExchange(ex); setForm({ stars: 5, feedback: '' }) }}>
                <p className="font-medium text-sm text-slate-200">{ex.skillOffered} ↔ {ex.skillWanted}</p>
                <p className="text-xs text-slate-400">Peer: {peer?.name || 'Peer'}</p>
                {ex.alreadyRated && <Badge variant="default" className="mt-1">Already Rated</Badge>}
              </div>
            ) })}
            {!exchanges.length && <p className="text-sm text-slate-500 text-center py-4">No exchanges ready for rating.</p>}
          </div>
        </Card>
        <Card>
          <CardHeader title={selectedExchange ? `Rate ${selectedPeer?.name || 'peer'}` : 'Rate user'} subtitle={selectedExchange ? 'Add a star rating and feedback.' : 'Select an exchange first.'} />
          {selectedExchange ? (
            <form onSubmit={submit} className="space-y-4">
              <div className="flex gap-1">{[1,2,3,4,5].map((s) => (<button key={s} type="button" onClick={() => setForm({ ...form, stars: s })} className={`text-2xl transition-colors ${form.stars >= s ? 'text-amber-400' : 'text-slate-600'}`}>★</button>))}</div>
              <textarea rows={4} value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} placeholder="Share what went well..." className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-colors resize-none" />
              <Button type="submit">Submit Rating</Button>
            </form>
          ) : <p className="text-sm text-slate-500 text-center py-8">Pick an exchange from the list.</p>}
        </Card>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Received Ratings" subtitle="Feedback from peers." />
          {received.length === 0 ? <p className="text-sm text-slate-500 text-center py-4">No received ratings yet.</p> : received.map((r) => {
            const stars = Math.max(0, Math.min(5, Number(r.stars) || 0)); const peer = r.reviewer
            return (<div key={r._id} className="p-3 border-b border-slate-800 last:border-0"><div className="flex items-center justify-between"><span className="text-amber-400">{'★'.repeat(stars)}{'☆'.repeat(5-stars)}</span><span className="text-xs text-slate-500">{stars}/5</span></div><p className="text-sm text-slate-300 mt-1">{r.feedback || 'No feedback.'}</p><p className="text-xs text-slate-500 mt-1">From: {peer?.name || 'Peer'}</p></div>)
          })}
        </Card>
        <Card>
          <CardHeader title="Sent Ratings" subtitle="Reviews you have submitted." />
          {sent.length === 0 ? <p className="text-sm text-slate-500 text-center py-4">No sent ratings yet.</p> : sent.map((r) => {
            const stars = Math.max(0, Math.min(5, Number(r.stars) || 0)); const peer = r.reviewee
            return (<div key={r._id} className="p-3 border-b border-slate-800 last:border-0"><div className="flex items-center justify-between"><span className="text-amber-400">{'★'.repeat(stars)}{'☆'.repeat(5-stars)}</span><span className="text-xs text-slate-500">{stars}/5</span></div><p className="text-sm text-slate-300 mt-1">{r.feedback || 'No feedback.'}</p><p className="text-xs text-slate-500 mt-1">To: {peer?.name || 'Peer'}</p></div>)
          })}
        </Card>
      </div>
    </motion.div>
  )
}
