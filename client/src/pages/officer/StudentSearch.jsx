import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, ExternalLink, Filter, Pencil, Search, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import Card, { CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'
import {
  exportOfficerStudents,
  getOfficerStudents,
  updateOfficerStudentProfile,
} from '../../services/officerService'
import { extractMessage } from '../../services/api'

const placementStatuses = ['not_started', 'preparing', 'eligible', 'applied', 'interviewing', 'placed', 'not_interested']

const statusVariant = (status) => {
  if (status === 'placed') return 'success'
  if (status === 'eligible' || status === 'interviewing') return 'info'
  if (status === 'not_interested') return 'danger'
  if (status === 'applied' || status === 'preparing') return 'warning'
  return 'default'
}

const emptyFilters = {
  search: '',
  skills: '',
  branch: '',
  year: '',
  minCgpa: '',
  maxCgpa: '',
  certifications: '',
  placementStatus: '',
  mentorAssigned: '',
}

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function StudentSearch() {
  const [students, setStudents] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [filterOptions, setFilterOptions] = useState({})
  const [filters, setFilters] = useState(emptyFilters)
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [profileForm, setProfileForm] = useState({})
  const [saving, setSaving] = useState(false)

  const params = useMemo(() => ({ ...appliedFilters, page, limit: 12 }), [appliedFilters, page])

  const loadStudents = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await getOfficerStudents(params)
      setStudents(data.students || [])
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 })
      setFilterOptions(data.filterOptions || {})
    } catch (err) {
      setError(extractMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [params])

  const applyFilters = (event) => {
    event.preventDefault()
    setPage(1)
    setAppliedFilters(filters)
  }

  const resetFilters = () => {
    setFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
    setPage(1)
  }

  const openProfileModal = (student) => {
    setSelectedStudent(student)
    setProfileForm({
      branch: student.branch || '',
      year: student.year || '',
      cgpa: student.cgpa || '',
      certifications: (student.certifications || []).join(', '),
      placementStatus: student.placementStatus || 'not_started',
      resumeUrl: student.resumeUrl || '',
      portfolioUrl: student.portfolioUrl || '',
    })
  }

  const saveProfile = async () => {
    if (!selectedStudent) return
    setSaving(true)
    try {
      await updateOfficerStudentProfile(selectedStudent.id, {
        ...profileForm,
        year: profileForm.year ? Number(profileForm.year) : undefined,
        cgpa: profileForm.cgpa ? Number(profileForm.cgpa) : 0,
        certifications: profileForm.certifications,
      })
      toast.success('Student profile updated')
      setSelectedStudent(null)
      loadStudents()
    } catch (err) {
      toast.error(extractMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const exportStudents = async () => {
    try {
      const res = await exportOfficerStudents(appliedFilters)
      downloadBlob(res.data, 'students.csv')
      toast.success('Student export downloaded')
    } catch (err) {
      toast.error(extractMessage(err))
    }
  }

  if (loading && students.length === 0) return <Loader />
  if (error && students.length === 0) return <ErrorMessage message={error} onRetry={loadStudents} />

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Student Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{pagination.total || 0} student profiles found.</p>
        </div>
        <Button variant="secondary" onClick={exportStudents}><Download className="w-4 h-4" /> Export CSV</Button>
      </div>

      <Card>
        <form onSubmit={applyFilters} className="space-y-4">
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
            <Input label="Search" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Name, email, skill" />
            <Input label="Skills" value={filters.skills} onChange={(e) => setFilters({ ...filters, skills: e.target.value })} placeholder="React, Python" />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Branch</label>
              <select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                <option value="">All branches</option>
                {(filterOptions.branches || []).map((branch) => <option key={branch} value={branch}>{branch}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Year</label>
              <select value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                <option value="">All years</option>
                {(filterOptions.years || []).map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-3">
            <Input label="Min CGPA" type="number" step="0.1" value={filters.minCgpa} onChange={(e) => setFilters({ ...filters, minCgpa: e.target.value })} />
            <Input label="Max CGPA" type="number" step="0.1" value={filters.maxCgpa} onChange={(e) => setFilters({ ...filters, maxCgpa: e.target.value })} />
            <Input label="Certifications" value={filters.certifications} onChange={(e) => setFilters({ ...filters, certifications: e.target.value })} placeholder="AWS, NPTEL" />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Placement Status</label>
              <select value={filters.placementStatus} onChange={(e) => setFilters({ ...filters, placementStatus: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                <option value="">All statuses</option>
                {placementStatuses.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mentor</label>
              <select value={filters.mentorAssigned} onChange={(e) => setFilters({ ...filters, mentorAssigned: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                <option value="">Any</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={resetFilters}>Reset</Button>
            <Button type="submit"><Filter className="w-4 h-4" /> Apply Filters</Button>
          </div>
        </form>
      </Card>

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-5 py-4 font-medium">Student</th>
                <th className="px-5 py-4 font-medium">Profile</th>
                <th className="px-5 py-4 font-medium">Skills</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Files</th>
                <th className="px-5 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-slate-500">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    No students match the current filters.
                  </td>
                </tr>
              ) : students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold">
                        {student.name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{student.name}</p>
                        <p className="text-xs text-slate-500">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                    <p>{student.branch || 'Branch not set'} - Year {student.year || '-'}</p>
                    <p className="text-xs text-slate-500">CGPA {student.cgpa || 0} - Mentor {student.mentor?.name || 'Unassigned'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1 max-w-sm">
                      {(student.skillNames || []).slice(0, 4).map((skill) => <Badge key={skill} variant="default">{skill}</Badge>)}
                      {(student.skillNames || []).length > 4 && <Badge variant="info">+{student.skillNames.length - 4}</Badge>}
                    </div>
                  </td>
                  <td className="px-5 py-4"><Badge variant={statusVariant(student.placementStatus)}>{student.placementStatus?.replaceAll('_', ' ')}</Badge></td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      {student.resumeUrl ? <a className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline" href={student.resumeUrl} target="_blank" rel="noreferrer">Resume <ExternalLink className="w-3 h-3" /></a> : <span className="text-slate-400">No resume</span>}
                      {student.portfolioUrl ? <a className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline" href={student.portfolioUrl} target="_blank" rel="noreferrer">Portfolio <ExternalLink className="w-3 h-3" /></a> : null}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button size="sm" variant="ghost" onClick={() => openProfileModal(student)}><Pencil className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Page {pagination.page || 1} of {pagination.pages || 1}</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button>
          <Button variant="secondary" size="sm" disabled={page >= (pagination.pages || 1)} onClick={() => setPage((value) => value + 1)}>Next</Button>
        </div>
      </div>

      <Modal isOpen={Boolean(selectedStudent)} onClose={() => setSelectedStudent(null)} title="Update Student Profile" maxWidth="max-w-3xl">
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Branch" value={profileForm.branch || ''} onChange={(e) => setProfileForm({ ...profileForm, branch: e.target.value })} />
          <Input label="Year" type="number" value={profileForm.year || ''} onChange={(e) => setProfileForm({ ...profileForm, year: e.target.value })} />
          <Input label="CGPA" type="number" step="0.1" value={profileForm.cgpa || ''} onChange={(e) => setProfileForm({ ...profileForm, cgpa: e.target.value })} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Placement Status</label>
            <select value={profileForm.placementStatus || 'not_started'} onChange={(e) => setProfileForm({ ...profileForm, placementStatus: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
              {placementStatuses.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
            </select>
          </div>
          <Input label="Certifications" value={profileForm.certifications || ''} onChange={(e) => setProfileForm({ ...profileForm, certifications: e.target.value })} />
          <Input label="Resume URL" value={profileForm.resumeUrl || ''} onChange={(e) => setProfileForm({ ...profileForm, resumeUrl: e.target.value })} />
          <Input label="Portfolio URL" value={profileForm.portfolioUrl || ''} onChange={(e) => setProfileForm({ ...profileForm, portfolioUrl: e.target.value })} className="md:col-span-2" />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => setSelectedStudent(null)}>Cancel</Button>
          <Button loading={saving} onClick={saveProfile}>Save Profile</Button>
        </div>
      </Modal>
    </motion.div>
  )
}
