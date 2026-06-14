import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api, { extractMessage } from '../../../services/api'
import Card, { CardHeader } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'

const initial = { skillName: '', category: 'Programming', level: 'Beginner', description: '', wantsToLearn: '' }
const toList = (v) => v.split(',').map((i) => i.trim()).filter(Boolean)

export default function PostSkillPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await api.post('/skills', { ...form, wantsToLearn: toList(form.wantsToLearn) })
      navigate('/student/barter/my-skills')
    } catch (err) { setError(extractMessage(err)) }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-100">Post a Skill</h1>
      <Card>
        <CardHeader title="Skill details" subtitle="Describe what you can teach and what you want to learn." />
        {error && <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <input value={form.skillName} onChange={(e) => setForm({ ...form, skillName: e.target.value })} placeholder="Skill name (e.g. Python)" required className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-colors" />
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" required className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-colors" />
          <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-colors">
            <option>Beginner</option><option>Intermediate</option><option>Expert</option>
          </select>
          <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What can you teach?" className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-colors resize-none" />
          <input value={form.wantsToLearn} onChange={(e) => setForm({ ...form, wantsToLearn: e.target.value })} placeholder="Skills wanted in return (e.g. Figma, public speaking)" className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-colors" />
          <Button type="submit">Publish Skill</Button>
        </form>
      </Card>
    </motion.div>
  )
}
