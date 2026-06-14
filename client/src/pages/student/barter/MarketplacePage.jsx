import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api, { extractMessage } from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import Card, { CardHeader } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'

export default function MarketplacePage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [skills, setSkills] = useState([])
  const [filters, setFilters] = useState({ search: '', category: '' })
  const [request, setRequest] = useState({ receiver: '', receiverName: '', skillOffered: '', skillWanted: '', note: '' })
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const categories = useMemo(() => [...new Set(skills.map((s) => s.category).filter(Boolean))], [skills])

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/skills', { params: filters })
        setSkills(data.skills || [])
      } catch (err) { setError(extractMessage(err)) }
    }
    load()
  }, [filters.search, filters.category])

  const selectSkill = (skill) => {
    setRequest({ receiver: skill.user?._id || skill.user?.id || skill.user || '', receiverName: skill.user?.name || 'Selected user', skillOffered: '', skillWanted: skill.skillName, note: `I would like to learn ${skill.skillName}.` })
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }

  const sendRequest = async (event) => {
    event.preventDefault()
    setNotice(''); setError('')
    try {
      const { receiver, skillOffered, skillWanted, note } = request
      await api.post('/exchanges', { receiver, skillOffered, skillWanted, note })
      setNotice('Exchange request sent.')
      setRequest({ receiver: '', receiverName: '', skillOffered: '', skillWanted: '', note: '' })
    } catch (err) { setError(extractMessage(err)) }
  }

  const messageUser = async (targetUser) => {
    const peerId = targetUser?._id || targetUser?.id || targetUser
    if (!peerId) return
    setError('')
    try {
      await api.post('/messages/conversations', { peerId })
      navigate('/student/barter/chat', { state: { peerId } })
    } catch (err) { setError(extractMessage(err)) }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Marketplace</h1>
      <Card>
        <CardHeader title="Search marketplace" subtitle="Search skills, filter by category, and send a request to start learning." />
        <div className="flex flex-col sm:flex-row gap-3">
          <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search by skill, description, or category" className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-colors" />
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-colors">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </Card>
      {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map((skill) => (
          <Card key={skill._id}>
            <div className="flex items-start justify-between mb-2"><strong className="text-slate-100">{skill.skillName}</strong><Badge variant={skill.level === 'Expert' ? 'success' : skill.level === 'Intermediate' ? 'warning' : 'default'}>{skill.level || 'Beginner'}</Badge></div>
            <p className="text-sm text-slate-400 mb-3">{skill.description || 'No description.'}</p>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-3"><span>{skill.category || 'General'}</span><span>{skill.user?.name || 'Anonymous'}</span></div>
            {skill.wantsToLearn?.length > 0 && <div className="flex flex-wrap gap-1.5 mb-3">{skill.wantsToLearn.map((w) => <Badge key={w} variant="primary">{w}</Badge>)}</div>}
            <div className="flex gap-2">
              {isAuthenticated && <Button size="sm" onClick={() => selectSkill(skill)}>Send Request</Button>}
              {isAuthenticated && <Button size="sm" variant="ghost" onClick={() => messageUser(skill.user)}>Message</Button>}
            </div>
          </Card>
        ))}
      </div>
      {isAuthenticated && (
        <Card>
          <CardHeader title="Send exchange request" subtitle="Choose what you can offer in return." />
          {notice && <div className="p-3 mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">{notice}</div>}
          <form onSubmit={sendRequest} className="space-y-4">
            <div className="flex items-center gap-2 text-sm"><span className="text-slate-400">Recipient:</span><strong className="text-slate-200">{request.receiverName || 'Choose a skill card first'}</strong></div>
            <input value={request.skillOffered} onChange={(e) => setRequest({ ...request, skillOffered: e.target.value })} placeholder="Skill offered (e.g. Python)" required className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-colors" />
            <input value={request.skillWanted} onChange={(e) => setRequest({ ...request, skillWanted: e.target.value })} placeholder="Skill wanted (e.g. Graphic Design)" required className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-colors" />
            <textarea rows={3} value={request.note} onChange={(e) => setRequest({ ...request, note: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-colors resize-none" />
            <Button type="submit">Send Exchange Request</Button>
          </form>
        </Card>
      )}
    </motion.div>
  )
}
