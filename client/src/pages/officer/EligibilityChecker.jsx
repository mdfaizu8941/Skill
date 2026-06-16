import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, ClipboardCheck, Save, Search, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card, { CardHeader } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'
import {
  checkOfficerEligibility,
  createOfficerCriteria,
  getOfficerCriteria,
  getOfficerOpportunities,
} from '../../services/officerService'
import { extractMessage } from '../../services/api'

const emptyCriteria = {
  name: '',
  description: '',
  minCgpa: '',
  requiredSkills: '',
  branches: '',
  years: '',
  certifications: '',
  placementStatuses: '',
  mentorAssigned: 'any',
}

const csvList = (value) => String(value || '').split(',').map((item) => item.trim()).filter(Boolean)

const buildCriteriaPayload = (criteria, opportunityId = '') => ({
  ...criteria,
  opportunityId: opportunityId || null,
  minCgpa: Number(criteria.minCgpa || 0),
  requiredSkills: csvList(criteria.requiredSkills),
  branches: csvList(criteria.branches),
  years: csvList(criteria.years).map(Number).filter(Number.isFinite),
  certifications: csvList(criteria.certifications),
  placementStatuses: csvList(criteria.placementStatuses),
})

function StudentList({ title, icon: Icon, students, variant }) {
  return (
    <Card>
      <CardHeader title={title} subtitle={`${students.length} students`} />
      <div className="space-y-3 max-h-[520px] overflow-y-auto">
        {students.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-10">No students in this group.</p>
        ) : students.map((student) => (
          <div key={student.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{student.name}</p>
                <p className="text-xs text-slate-500">{student.email}</p>
              </div>
              <Badge variant={variant}><Icon className="w-3 h-3 mr-1" />{student.eligibility?.eligible ? 'Eligible' : 'Not eligible'}</Badge>
            </div>
            <div className="mt-3 grid sm:grid-cols-3 gap-2 text-xs text-slate-500">
              <span>{student.branch || 'No branch'}</span>
              <span>Year {student.year || '-'}</span>
              <span>CGPA {student.cgpa || 0}</span>
            </div>
            {!student.eligibility?.eligible && (
              <div className="mt-3 flex flex-wrap gap-1">
                {(student.eligibility?.reasons || []).map((reason) => <Badge key={reason} variant="warning">{reason}</Badge>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function EligibilityChecker() {
  const [criteria, setCriteria] = useState(emptyCriteria)
  const [criteriaList, setCriteriaList] = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [selectedCriteriaId, setSelectedCriteriaId] = useState('')
  const [selectedOpportunityId, setSelectedOpportunityId] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [criteriaRes, opportunityRes] = await Promise.all([
        getOfficerCriteria(),
        getOfficerOpportunities({ status: 'active', limit: 100 }),
      ])
      setCriteriaList(criteriaRes.data.criteria || [])
      setOpportunities(opportunityRes.data.opportunities || [])
    } catch (err) {
      setError(extractMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const runCheck = async () => {
    setChecking(true)
    try {
      const payload = selectedCriteriaId
        ? { criteriaId: selectedCriteriaId }
        : selectedOpportunityId
          ? { opportunityId: selectedOpportunityId }
          : { criteria: buildCriteriaPayload(criteria) }
      const { data } = await checkOfficerEligibility(payload)
      setResult(data)
      toast.success('Eligibility check completed')
    } catch (err) {
      toast.error(extractMessage(err))
    } finally {
      setChecking(false)
    }
  }

  const saveCriteria = async () => {
    if (!criteria.name.trim()) {
      toast.error('Criteria name is required')
      return
    }
    setSaving(true)
    try {
      await createOfficerCriteria(buildCriteriaPayload(criteria, selectedOpportunityId))
      toast.success('Eligibility criteria saved')
      setCriteria(emptyCriteria)
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Eligibility Checker</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Create criteria and automatically separate eligible and non-eligible students.</p>
      </div>

      <div className="grid xl:grid-cols-[420px_1fr] gap-6">
        <Card>
          <CardHeader title="Criteria" subtitle="Use a saved rule, opportunity rule, or enter new criteria" />
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Saved Criteria</label>
              <select value={selectedCriteriaId} onChange={(e) => setSelectedCriteriaId(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                <option value="">Custom criteria</option>
                {criteriaList.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Opportunity</label>
              <select value={selectedOpportunityId} onChange={(e) => setSelectedOpportunityId(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                <option value="">No linked opportunity</option>
                {opportunities.map((item) => <option key={item._id} value={item._id}>{item.title}</option>)}
              </select>
            </div>

            <Input label="Criteria Name" value={criteria.name} onChange={(e) => setCriteria({ ...criteria, name: e.target.value })} />
            <Input label="Minimum CGPA" type="number" step="0.1" value={criteria.minCgpa} onChange={(e) => setCriteria({ ...criteria, minCgpa: e.target.value })} />
            <Input label="Required Skills" value={criteria.requiredSkills} onChange={(e) => setCriteria({ ...criteria, requiredSkills: e.target.value })} placeholder="React, SQL, Python" />
            <Input label="Branches" value={criteria.branches} onChange={(e) => setCriteria({ ...criteria, branches: e.target.value })} placeholder="CSE, ECE" />
            <Input label="Years" value={criteria.years} onChange={(e) => setCriteria({ ...criteria, years: e.target.value })} placeholder="3, 4" />
            <Input label="Certifications" value={criteria.certifications} onChange={(e) => setCriteria({ ...criteria, certifications: e.target.value })} />
            <Input label="Placement Statuses" value={criteria.placementStatuses} onChange={(e) => setCriteria({ ...criteria, placementStatuses: e.target.value })} placeholder="eligible, preparing" />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mentor Assigned</label>
              <select value={criteria.mentorAssigned} onChange={(e) => setCriteria({ ...criteria, mentorAssigned: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                <option value="any">Any</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={saveCriteria} loading={saving} variant="secondary"><Save className="w-4 h-4" /> Save</Button>
              <Button onClick={runCheck} loading={checking}><Search className="w-4 h-4" /> Check</Button>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">Eligibility Result</h2>
                <p className="text-sm text-slate-500">
                  {result ? `${result.summary.eligible} eligible and ${result.summary.nonEligible} non-eligible out of ${result.summary.total}` : 'Run a check to see matched students.'}
                </p>
              </div>
            </div>
          </Card>

          {result && (
            <div className="grid lg:grid-cols-2 gap-6">
              <StudentList title="Eligible Students" icon={CheckCircle2} students={result.eligible || []} variant="success" />
              <StudentList title="Non-Eligible Students" icon={XCircle} students={result.nonEligible || []} variant="danger" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
