import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api, { extractMessage } from '../../../services/api'
import useAsync from '../../../hooks/useAsync'
import Card, { CardHeader } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import Loader from '../../../components/common/Loader'
import ErrorMessage from '../../../components/common/ErrorMessage'

const toCsv = (items = []) => items.join(', ')
const toList = (value) => value.split(',').map((i) => i.trim()).filter(Boolean)

export default function MySkillsPage() {
  const { data, loading, error, reload } = useAsync(async () => {
    const { data } = await api.get('/skills/mine')
    return data.skills || []
  }, [])
  const [editing, setEditing] = useState(null)
  const [localError, setLocalError] = useState('')

  const edit = (skill) => setEditing({ ...skill, wantsToLearn: toCsv(skill.wantsToLearn) })

  const save = async (event) => {
    event.preventDefault()
    setLocalError('')
    try {
      await api.put(`/skills/${editing._id}`, { ...editing, wantsToLearn: toList(editing.wantsToLearn) })
      setEditing(null)
      reload()
    } catch (err) { setLocalError(extractMessage(err)) }
  }

  const remove = async (id) => {
    await api.delete(`/skills/${id}`)
    reload()
  }

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={reload} />

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-slate-100">My Skills</h1><Link to="/student/barter/post-skill"><Button>Add New Skill</Button></Link></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data || []).map((skill) => (
          <Card key={skill._id}>
            <div className="flex items-start justify-between mb-2"><strong className="text-slate-100">{skill.skillName}</strong><Badge>{skill.level || 'Beginner'}</Badge></div>
            <p className="text-sm text-slate-400 mb-2">{skill.description || 'No description.'}</p>
            <p className="text-xs text-slate-500 mb-3">{skill.category || 'General'}</p>
            {skill.wantsToLearn?.length > 0 && <div className="flex flex-wrap gap-1.5 mb-3">{skill.wantsToLearn.map((w) => <Badge key={w} variant="primary">{w}</Badge>)}</div>}
            <div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => edit(skill)}>Edit</Button><Button size="sm" variant="danger" onClick={() => remove(skill._id)}>Delete</Button></div>
          </Card>
        ))}
      </div>
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit skill">
        {editing && (
          <form onSubmit={save} className="space-y-4">
            {localError && <p className="text-sm text-red-400">{localError}</p>}
            <input value={editing.skillName} onChange={(e) => setEditing({ ...editing, skillName: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-colors" placeholder="Skill name" />
            <input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-colors" placeholder="Category" />
            <select value={editing.level} onChange={(e) => setEditing({ ...editing, level: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-colors">
              <option>Beginner</option><option>Intermediate</option><option>Expert</option>
            </select>
            <textarea rows={3} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-colors resize-none" placeholder="Description" />
            <input value={editing.wantsToLearn} onChange={(e) => setEditing({ ...editing, wantsToLearn: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-colors" placeholder="Skills wanted (comma separated)" />
            <div className="flex gap-2"><Button type="submit">Save</Button><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button></div>
          </form>
        )}
      </Modal>
    </motion.div>
  )
}
