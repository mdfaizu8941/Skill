import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  Plus,
  Trash2,
  Upload,
  Search,
  FileText,
  Link as LinkIcon,
  CheckCircle,
  Clock,
  XCircle,
  User,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Card, { CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'
import { getMySkills, createSkill, deleteSkill } from '../../services/skillService'
import { getMyEvidence, submitEvidence } from '../../services/evidenceService'

export default function SkillsEvidence() {
  const [activeTab, setActiveTab] = useState('skills')
  const [skills, setSkills] = useState([])
  const [evidence, setEvidence] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Skills state
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [selectedSkills, setSelectedSkills] = useState([])
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false)
  const [addingSkill, setAddingSkill] = useState(false)

  // Evidence state
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false)
  const [submittingEvidence, setSubmittingEvidence] = useState(false)
  const [evidenceType, setEvidenceType] = useState('file')

  const {
    register: registerSkill,
    handleSubmit: handleSubmitSkill,
    formState: { errors: skillErrors },
    reset: resetSkill,
  } = useForm()

  const {
    register: registerEvidence,
    handleSubmit: handleSubmitEvidence,
    formState: { errors: evidenceErrors },
    reset: resetEvidence,
  } = useForm()

  const fetchData = async () => {
    try {
      setLoading(true)
      const [skillsRes, evidenceRes] = await Promise.all([
        getMySkills(),
        getMyEvidence(),
      ])
      setSkills(skillsRes.data.skills || [])
      setEvidence(evidenceRes.data.evidence || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddSkill = async (data) => {
    setAddingSkill(true)
    try {
      const res = await createSkill({
        skillName: data.skillName,
        category: data.category,
        level: data.level,
      })
      setSkills([...skills, res.data.skill])
      toast.success('Skill added successfully!')
      setIsSkillModalOpen(false)
      resetSkill()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add skill')
    } finally {
      setAddingSkill(false)
    }
  }

  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm('Are you sure you want to delete this skill?')) return

    try {
      await deleteSkill(skillId)
      setSkills(skills.filter((s) => s._id !== skillId))
      toast.success('Skill deleted successfully!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete skill')
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedSkills.length === 0) return
    if (!window.confirm(`Delete ${selectedSkills.length} selected skill(s)?`)) return

    try {
      await Promise.all(selectedSkills.map((id) => deleteSkill(id)))
      setSkills(skills.filter((s) => !selectedSkills.includes(s._id)))
      setSelectedSkills([])
      toast.success('Skills deleted successfully!')
    } catch (err) {
      toast.error('Failed to delete some skills')
    }
  }

  const onSubmitEvidence = async (data) => {
    setSubmittingEvidence(true)
    try {
      const payload = {
        skillId: data.skillId,
        type: evidenceType,
      }

      if (evidenceType === 'url') {
        payload.externalLink = data.url
      } else {
        // For file upload, you'd handle FormData here
        payload.fileUrl = data.fileUrl // Placeholder - implement file upload as needed
      }

      const res = await submitEvidence(payload)
      setEvidence([...evidence, res.data.evidence])
      toast.success('Evidence submitted successfully!')
      setIsEvidenceModalOpen(false)
      resetEvidence()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit evidence')
    } finally {
      setSubmittingEvidence(false)
    }
  }

  const toggleSkillSelection = (skillId) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    )
  }

  const getLevelBadgeVariant = (level) => {
    if (level === 'Beginner') return 'info'
    if (level === 'Intermediate') return 'warning'
    if (level === 'Expert') return 'success'
    return 'default'
  }

  const getStatusBadgeVariant = (status) => {
    if (status === 'approved') return 'success'
    if (status === 'rejected') return 'danger'
    return 'warning'
  }

  const getStatusIcon = (status) => {
    if (status === 'approved') return <CheckCircle className="w-4 h-4" />
    if (status === 'rejected') return <XCircle className="w-4 h-4" />
    return <Clock className="w-4 h-4" />
  }

  const filteredSkills = skills.filter((skill) => {
    const matchesSearch = skill.skillName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !categoryFilter || skill.category === categoryFilter
    const matchesLevel = !levelFilter || skill.level === levelFilter
    return matchesSearch && matchesCategory && matchesLevel
  })

  const categories = [...new Set(skills.map((s) => s.category))].filter(Boolean)
  const levels = ['Beginner', 'Intermediate', 'Expert']

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Skills & Evidence</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('skills')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'skills'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          My Skills
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'evidence'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Evidence Submissions
        </button>
      </div>

      {/* My Skills Tab */}
      {activeTab === 'skills' && (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
              <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                >
                  <option value="">All Levels</option>
                  {levels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                {selectedSkills.length > 0 && (
                  <Button variant="danger" size="sm" onClick={handleDeleteSelected}>
                    <Trash2 className="w-4 h-4" />
                    Delete Selected ({selectedSkills.length})
                  </Button>
                )}
                <Button size="sm" onClick={() => setIsSkillModalOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Add Skill
                </Button>
              </div>
            </div>

            {filteredSkills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <User className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {searchQuery || categoryFilter || levelFilter
                    ? 'No skills match your filters'
                    : 'No skills added yet. Add your first skill or parse your resume.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredSkills.map((skill) => (
                  <div
                    key={skill._id}
                    className={`p-4 rounded-lg border transition-colors ${
                      selectedSkills.includes(skill._id)
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedSkills.includes(skill._id)}
                        onChange={() => toggleSkillSelection(skill._id)}
                        className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 dark:text-slate-200 mb-2 truncate">
                          {skill.skillName}
                        </h4>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="default">{skill.category}</Badge>
                          <Badge variant={getLevelBadgeVariant(skill.level)}>{skill.level}</Badge>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSkill(skill._id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Evidence Tab */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardHeader title="Evidence Submissions" subtitle="Track your submitted evidence" />
              <Button size="sm" onClick={() => setIsEvidenceModalOpen(true)}>
                <Upload className="w-4 h-4" />
                Submit Evidence
              </Button>
            </div>

            {evidence.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  No evidence submitted yet. Submit your first evidence.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {evidence.map((item) => (
                  <div
                    key={item._id}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-slate-900 dark:text-slate-200">
                            {item.skillId?.skillName || 'Unknown Skill'}
                          </h4>
                          <Badge variant={getStatusBadgeVariant(item.status)}>
                            {getStatusIcon(item.status)}
                            {item.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 mb-2">
                          <span className="flex items-center gap-1">
                            {item.type === 'file' ? (
                              <FileText className="w-4 h-4" />
                            ) : (
                              <LinkIcon className="w-4 h-4" />
                            )}
                            {item.type}
                          </span>
                          <span>
                            {item.submittedAt
                              ? new Date(item.submittedAt).toLocaleDateString()
                              : 'N/A'}
                          </span>
                        </div>
                        {item.status === 'rejected' && item.mentorNote && (
                          <div className="mt-2 p-2 rounded bg-red-50 dark:bg-red-500/10 text-sm text-red-700 dark:text-red-400">
                            <strong>Mentor Note:</strong> {item.mentorNote}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Add Skill Modal */}
      <Modal
        isOpen={isSkillModalOpen}
        onClose={() => {
          setIsSkillModalOpen(false)
          resetSkill()
        }}
        title="Add Skill"
      >
        <form onSubmit={handleSubmitSkill(handleAddSkill)} className="space-y-4">
          <Input
            label="Skill Name"
            error={skillErrors.skillName?.message}
            {...registerSkill('skillName', { required: 'Skill name is required' })}
          />
          <Input
            label="Category"
            error={skillErrors.category?.message}
            {...registerSkill('category', { required: 'Category is required' })}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Level</label>
            <select
              className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              {...registerSkill('level', { required: 'Level is required' })}
            >
              <option value="">Select level</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Expert">Expert</option>
            </select>
            {skillErrors.level && (
              <span className="text-sm text-red-500 dark:text-red-400">
                {skillErrors.level.message}
              </span>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsSkillModalOpen(false)
                resetSkill()
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" loading={addingSkill} className="flex-1">
              Add Skill
            </Button>
          </div>
        </form>
      </Modal>

      {/* Submit Evidence Modal */}
      <Modal
        isOpen={isEvidenceModalOpen}
        onClose={() => {
          setIsEvidenceModalOpen(false)
          resetEvidence()
        }}
        title="Submit Evidence"
      >
        <form onSubmit={handleSubmitEvidence(onSubmitEvidence)} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Skill</label>
            <select
              className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              {...registerEvidence('skillId', { required: 'Skill is required' })}
            >
              <option value="">Select a skill</option>
              {skills.map((skill) => (
                <option key={skill._id} value={skill._id}>
                  {skill.skillName}
                </option>
              ))}
            </select>
            {evidenceErrors.skillId && (
              <span className="text-sm text-red-500 dark:text-red-400">
                {evidenceErrors.skillId.message}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEvidenceType('file')}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                evidenceType === 'file'
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400'
                  : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <FileText className="w-4 h-4 mx-auto mb-1" />
              File
            </button>
            <button
              type="button"
              onClick={() => setEvidenceType('url')}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                evidenceType === 'url'
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400'
                  : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <LinkIcon className="w-4 h-4 mx-auto mb-1" />
              URL
            </button>
          </div>

          {evidenceType === 'url' ? (
            <Input
              label="Evidence URL"
              type="url"
              placeholder="https://..."
              error={evidenceErrors.url?.message}
              {...registerEvidence('url', { required: 'URL is required' })}
            />
          ) : (
            <Input
              label="Upload File"
              type="file"
              error={evidenceErrors.fileUrl?.message}
              {...registerEvidence('fileUrl', { required: 'File is required' })}
            />
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsEvidenceModalOpen(false)
                resetEvidence()
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" loading={submittingEvidence} className="flex-1">
              Submit
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  )
}
