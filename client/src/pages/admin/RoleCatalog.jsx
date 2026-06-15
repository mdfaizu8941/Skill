import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Layers, Plus, Trash2, Edit2, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'
import api from '../../services/api'

const LEVELS = ['beginner', 'intermediate', 'advanced']

const emptyRole = {
  title: '',
  description: '',
  industry: '',
  requiredSkills: []
}

const emptySkill = { skillName: '', level: 'intermediate', weight: 5 }

export default function RoleCatalog() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [form, setForm] = useState(emptyRole)
  const [skillInput, setSkillInput] = useState(emptySkill)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const fetchRoles = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/career-roles')
      setRoles(res.data.roles || res.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRoles() }, [])

  const openCreate = () => {
    setEditingRole(null)
    setForm(emptyRole)
    setSkillInput(emptySkill)
    setModalOpen(true)
  }

  const openEdit = (role) => {
    setEditingRole(role)
    setForm({
      title: role.title,
      description: role.description || '',
      industry: role.industry || '',
      requiredSkills: role.requiredSkills || []
    })
    setSkillInput(emptySkill)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingRole(null)
    setForm(emptyRole)
    setSkillInput(emptySkill)
  }

  const addSkill = () => {
    if (!skillInput.skillName.trim()) {
      toast.error('Skill name is required')
      return
    }
    const duplicate = form.requiredSkills.find(
      s => s.skillName.toLowerCase() === skillInput.skillName.toLowerCase().trim()
    )
    if (duplicate) {
      toast.error('Skill already added')
      return
    }
    setForm(prev => ({
      ...prev,
      requiredSkills: [...prev.requiredSkills, {
        skillName: skillInput.skillName.trim(),
        level: skillInput.level,
        weight: Number(skillInput.weight)
      }]
    }))
    setSkillInput(emptySkill)
  }

  const removeSkill = (index) => {
    setForm(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((_, i) => i !== index)
    }))
  }

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required')
    if (!form.industry.trim()) return toast.error('Industry is required')
    if (form.requiredSkills.length === 0) return toast.error('Add at least one required skill')

    setSaving(true)
    try {
      if (editingRole) {
        const res = await api.put(`/career-roles/${editingRole._id}`, form)
        setRoles(prev => prev.map(r => r._id === editingRole._id ? (res.data.role || res.data) : r))
        toast.success('Role updated successfully')
      } else {
        const res = await api.post('/career-roles', form)
        setRoles(prev => [...prev, res.data.role || res.data])
        toast.success('Role created successfully')
      }
      closeModal()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (role) => {
    if (!window.confirm(`Delete "${role.title}"? This cannot be undone.`)) return
    setDeletingId(role._id)
    try {
      await api.delete(`/career-roles/${role._id}`)
      setRoles(prev => prev.filter(r => r._id !== role._id))
      toast.success('Role deleted')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  const levelColor = (level) => {
    if (level === 'beginner') return 'info'
    if (level === 'intermediate') return 'warning'
    return 'success'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Role Catalog</h1>
          <p className="text-slate-400 mt-1">Define and manage industry career roles and required skills.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Add Role
        </Button>
      </div>

      {loading ? <Loader /> : error ? <ErrorMessage message={error} onRetry={fetchRoles} /> : (
        <>
          {roles.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <Layers className="w-12 h-12 text-slate-600 mb-4" />
              <p className="text-slate-400 mb-4">No career roles yet.</p>
              <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Add First Role</Button>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {roles.map(role => (
                <Card key={role._id} className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-200">{role.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{role.industry}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEdit(role)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(role)}
                        disabled={deletingId === role._id}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {role.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">{role.description}</p>
                  )}

                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-2">
                      Required Skills ({role.requiredSkills?.length || 0})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {role.requiredSkills?.slice(0, 6).map((skill, i) => (
                        <Badge key={i} variant={levelColor(skill.level)}>
                          {skill.skillName}
                        </Badge>
                      ))}
                      {role.requiredSkills?.length > 6 && (
                        <Badge variant="default">+{role.requiredSkills.length - 6} more</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingRole ? 'Edit Career Role' : 'Add Career Role'}
      >
        <div className="space-y-4">
          <Input
            label="Role Title"
            placeholder="e.g. Senior Frontend Developer"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          />
          <Input
            label="Industry"
            placeholder="e.g. Software Engineering"
            value={form.industry}
            onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Description</label>
            <textarea
              rows={3}
              placeholder="Brief description of this role..."
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Required Skills</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Skill name"
                value={skillInput.skillName}
                onChange={e => setSkillInput(p => ({ ...p, skillName: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addSkill()}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
              />
              <select
                value={skillInput.level}
                onChange={e => setSkillInput(p => ({ ...p, level: e.target.value }))}
                className="px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm focus:outline-none"
              >
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <input
                type="number"
                min={1}
                max={10}
                value={skillInput.weight}
                onChange={e => setSkillInput(p => ({ ...p, weight: e.target.value }))}
                className="w-16 px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm focus:outline-none text-center"
                title="Weight (1-10)"
              />
              <button
                onClick={addSkill}
                className="p-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">Press Enter or click + to add. Weight 1-10 (higher = more important).</p>

            {form.requiredSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                {form.requiredSkills.map((skill, i) => (
                  <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-700 text-xs">
                    <span className="text-slate-200">{skill.skillName}</span>
                    <span className="text-slate-400">·</span>
                    <Badge variant={levelColor(skill.level)}>{skill.level}</Badge>
                    <span className="text-slate-400">w:{skill.weight}</span>
                    <button onClick={() => removeSkill(i)} className="text-red-400 hover:text-red-300 ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={closeModal} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving} className="flex-1">
              <Check className="w-4 h-4 mr-2" />
              {editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}