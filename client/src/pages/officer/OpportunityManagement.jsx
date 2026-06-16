import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BriefcaseBusiness, Pencil, Plus, Trash2, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card, { CardHeader } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'
import {
  createOfficerOpportunity,
  deleteOfficerOpportunity,
  getOfficerOpportunities,
  getOfficerStudents,
  trackOfficerApplication,
  updateOfficerOpportunity,
} from '../../services/officerService'
import { extractMessage } from '../../services/api'

const categories = ['Internship', 'Placement', 'Hackathon', 'Scholarship', 'Workshop', 'Competition']
const statuses = ['draft', 'active', 'closed', 'archived']
const applicationStatuses = ['applied', 'shortlisted', 'rejected', 'selected', 'withdrawn']

const emptyForm = {
  title: '',
  organization: '',
  category: 'Internship',
  description: '',
  location: '',
  externalUrl: '',
  deadline: '',
  eventDate: '',
  status: 'active',
  minCgpa: '',
  requiredSkills: '',
  branches: '',
  years: '',
  certifications: '',
  placementStatuses: '',
  mentorAssigned: 'any',
}

const csvList = (value) => String(value || '').split(',').map((item) => item.trim()).filter(Boolean)
const dateInput = (date) => (date ? new Date(date).toISOString().slice(0, 10) : '')
const fmtDate = (date) => (date ? new Date(date).toLocaleDateString() : '-')

const fromOpportunity = (opportunity) => ({
  title: opportunity.title || '',
  organization: opportunity.organization || '',
  category: opportunity.category || 'Internship',
  description: opportunity.description || '',
  location: opportunity.location || '',
  externalUrl: opportunity.externalUrl || '',
  deadline: dateInput(opportunity.deadline),
  eventDate: dateInput(opportunity.eventDate),
  status: opportunity.status || 'active',
  minCgpa: opportunity.eligibility?.minCgpa || '',
  requiredSkills: (opportunity.eligibility?.requiredSkills || []).join(', '),
  branches: (opportunity.eligibility?.branches || []).join(', '),
  years: (opportunity.eligibility?.years || []).join(', '),
  certifications: (opportunity.eligibility?.certifications || []).join(', '),
  placementStatuses: (opportunity.eligibility?.placementStatuses || []).join(', '),
  mentorAssigned: opportunity.eligibility?.mentorAssigned || 'any',
})

const toPayload = (form) => ({
  title: form.title,
  organization: form.organization,
  category: form.category,
  description: form.description,
  location: form.location,
  externalUrl: form.externalUrl,
  deadline: form.deadline,
  eventDate: form.eventDate || null,
  status: form.status,
  eligibility: {
    minCgpa: Number(form.minCgpa || 0),
    requiredSkills: csvList(form.requiredSkills),
    branches: csvList(form.branches),
    years: csvList(form.years).map(Number).filter(Number.isFinite),
    certifications: csvList(form.certifications),
    placementStatuses: csvList(form.placementStatuses),
    mentorAssigned: form.mentorAssigned,
  },
})

export default function OpportunityManagement() {
  const [opportunities, setOpportunities] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [applicationModalOpen, setApplicationModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selectedOpportunity, setSelectedOpportunity] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [applicationForm, setApplicationForm] = useState({ studentId: '', status: 'applied', note: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [opportunityRes, studentRes] = await Promise.all([
        getOfficerOpportunities({ limit: 100 }),
        getOfficerStudents({ limit: 100 }),
      ])
      setOpportunities(opportunityRes.data.opportunities || [])
      setStudents(studentRes.data.students || [])
    } catch (err) {
      setError(extractMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (opportunity) => {
    setEditing(opportunity)
    setForm(fromOpportunity(opportunity))
    setModalOpen(true)
  }

  const saveOpportunity = async () => {
    if (!form.title.trim() || !form.deadline) {
      toast.error('Title and deadline are required')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await updateOfficerOpportunity(editing._id, toPayload(form))
        toast.success('Opportunity updated')
      } else {
        await createOfficerOpportunity(toPayload(form))
        toast.success('Opportunity created')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(extractMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const removeOpportunity = async (opportunity) => {
    if (!confirm(`Delete "${opportunity.title}"?`)) return
    try {
      await deleteOfficerOpportunity(opportunity._id)
      toast.success('Opportunity deleted')
      load()
    } catch (err) {
      toast.error(extractMessage(err))
    }
  }

  const openApplication = (opportunity) => {
    setSelectedOpportunity(opportunity)
    setApplicationForm({ studentId: '', status: 'applied', note: '' })
    setApplicationModalOpen(true)
  }

  const saveApplication = async () => {
    if (!selectedOpportunity || !applicationForm.studentId) {
      toast.error('Select a student')
      return
    }
    setSaving(true)
    try {
      await trackOfficerApplication(selectedOpportunity._id, applicationForm)
      toast.success('Application tracked')
      setApplicationModalOpen(false)
      load()
    } catch (err) {
      toast.error(extractMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={load} />

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Opportunity Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Create opportunities, set deadlines, define eligibility, and track applications.</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Create Opportunity</Button>
      </div>

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-500 bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left font-medium">Opportunity</th>
                <th className="px-6 py-4 text-left font-medium">Category</th>
                <th className="px-6 py-4 text-left font-medium">Deadline</th>
                <th className="px-6 py-4 text-center font-medium">Applications</th>
                <th className="px-6 py-4 text-left font-medium">Status</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {opportunities.map((opportunity) => (
                <tr key={opportunity._id}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{opportunity.title}</p>
                    <p className="text-xs text-slate-500">{opportunity.organization || opportunity.location || 'No organization'}</p>
                  </td>
                  <td className="px-6 py-4"><Badge variant="info">{opportunity.category}</Badge></td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{fmtDate(opportunity.deadline)}</td>
                  <td className="px-6 py-4 text-center">{opportunity.applications?.length || 0}</td>
                  <td className="px-6 py-4"><Badge variant={opportunity.status === 'active' ? 'success' : 'default'}>{opportunity.status}</Badge></td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openApplication(opportunity)}><UserPlus className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(opportunity)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => removeOpportunity(opportunity)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {opportunities.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-14 text-center text-slate-500"><BriefcaseBusiness className="w-10 h-10 mx-auto mb-2 opacity-40" />No opportunities yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Opportunity' : 'Create Opportunity'} maxWidth="max-w-5xl">
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Organization" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <Input label="Deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          <Input label="Event Date" type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
          <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input label="External URL" value={form.externalUrl} onChange={(e) => setForm({ ...form, externalUrl: e.target.value })} />
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 resize-none" />
          </div>
          <div className="md:col-span-2 border-t border-slate-200 dark:border-slate-800 pt-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Eligibility Criteria</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Input label="Min CGPA" type="number" step="0.1" value={form.minCgpa} onChange={(e) => setForm({ ...form, minCgpa: e.target.value })} />
              <Input label="Required Skills" value={form.requiredSkills} onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })} />
              <Input label="Branches" value={form.branches} onChange={(e) => setForm({ ...form, branches: e.target.value })} />
              <Input label="Years" value={form.years} onChange={(e) => setForm({ ...form, years: e.target.value })} />
              <Input label="Certifications" value={form.certifications} onChange={(e) => setForm({ ...form, certifications: e.target.value })} />
              <Input label="Placement Statuses" value={form.placementStatuses} onChange={(e) => setForm({ ...form, placementStatuses: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button loading={saving} onClick={saveOpportunity}>{editing ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>

      <Modal isOpen={applicationModalOpen} onClose={() => setApplicationModalOpen(false)} title="Track Application" maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Student</label>
            <select value={applicationForm.studentId} onChange={(e) => setApplicationForm({ ...applicationForm, studentId: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
              <option value="">Select student</option>
              {students.map((student) => <option key={student.id} value={student.id}>{student.name} - {student.email}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
            <select value={applicationForm.status} onChange={(e) => setApplicationForm({ ...applicationForm, status: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
              {applicationStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <Input label="Note" value={applicationForm.note} onChange={(e) => setApplicationForm({ ...applicationForm, note: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setApplicationModalOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={saveApplication}>Save Application</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
