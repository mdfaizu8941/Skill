import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, CheckCircle, XCircle, Search, Clock, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import api, { extractMessage } from '../../services/api'
import useAsync from '../../hooks/useAsync'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'
import { formatDate } from '../../utils/formatUtils'

export default function EvidenceReview() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('pending') // all, pending, approved, rejected
  const [updating, setUpdating] = useState(null)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedEvidence, setSelectedEvidence] = useState(null)
  const [mentorNote, setMentorNote] = useState('')

  const { data: evidenceList, loading, error, reload } = useAsync(async () => {
    const [pendingRes, reviewedRes] = await Promise.allSettled([
      api.get('/evidence/pending'),
      api.get('/evidence/reviewed'),
    ])
    const pending = pendingRes.status === 'fulfilled' ? pendingRes.value.data.evidence || [] : []
    const reviewed = reviewedRes.status === 'fulfilled' ? reviewedRes.value.data.evidence || [] : []
    return { pending, reviewed }
  }, [])

  const handleReview = async (id, status, note = '') => {
    try {
      setUpdating(id)
      await api.patch(`/evidence/${id}/review`, { status, mentorNote: note })
      toast.success(`Evidence ${status} successfully`)
      reload()
      if (status === 'rejected') {
        setRejectModalOpen(false)
        setMentorNote('')
        setSelectedEvidence(null)
      }
    } catch (err) {
      toast.error(extractMessage(err))
    } finally {
      setUpdating(null)
    }
  }

  const openRejectModal = (item) => {
    setSelectedEvidence(item)
    setRejectModalOpen(true)
  }

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={reload} />

  const { pending = [], reviewed = [] } = evidenceList || {}
  
  // Combine and filter based on active tab
  let displayList = []
  if (activeTab === 'all') {
    displayList = [...pending, ...reviewed]
  } else if (activeTab === 'pending') {
    displayList = pending
  } else if (activeTab === 'approved') {
    displayList = reviewed.filter((e) => e.status === 'approved')
  } else if (activeTab === 'rejected') {
    displayList = reviewed.filter((e) => e.status === 'rejected')
  }

  const filteredEvidence = displayList.filter(
    (item) =>
      item.skillId?.skillName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const tabs = [
    { id: 'all', label: 'All', count: pending.length + reviewed.length },
    { id: 'pending', label: 'Pending', count: pending.length },
    { id: 'approved', label: 'Approved', count: reviewed.filter((e) => e.status === 'approved').length },
    { id: 'rejected', label: 'Rejected', count: reviewed.filter((e) => e.status === 'rejected').length },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Evidence Review</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Review and manage student skill evidence.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student or skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <Card noPadding>
        {filteredEvidence.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-40 text-emerald-500" />
            <p className="text-lg font-medium text-slate-900 dark:text-slate-200">No evidence found</p>
            <p className="text-sm mt-1">
              {activeTab === 'pending'
                ? 'All caught up! No pending reviews.'
                : `No ${activeTab} evidence to display.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredEvidence.map((item) => (
              <div key={item._id} className="p-6 flex flex-col lg:flex-row gap-6 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                        {item.skillId?.skillName || 'Unknown Skill'}
                        {item.status !== 'pending' && (
                          <Badge variant={item.status === 'approved' ? 'success' : 'danger'}>
                            {item.status}
                          </Badge>
                        )}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                        <span>By {item.studentId?.name || 'Unknown Student'}</span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-medium text-slate-900 dark:text-slate-200 block mb-1">Student's Description:</span>
                    {item.externalLink || item.fileUrl || 'No description provided'}
                  </div>

                  {item.mentorNote && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
                      <span className="font-medium text-amber-900 dark:text-amber-200 block mb-1">Mentor Feedback:</span>
                      <p className="text-amber-800 dark:text-amber-300">{item.mentorNote}</p>
                    </div>
                  )}

                  {(item.externalLink || item.fileUrl) && (
                    <a
                      href={item.externalLink || item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium"
                    >
                      <ExternalLink className="w-4 h-4" /> View Supporting Link
                    </a>
                  )}
                </div>

                {item.status === 'pending' && (
                  <div className="flex lg:flex-col items-center gap-3 shrink-0 lg:w-48 lg:border-l lg:border-slate-200 dark:lg:border-slate-800 lg:pl-6 justify-end lg:justify-center">
                    <Button
                      variant="success"
                      fullWidth
                      loading={updating === item._id}
                      onClick={() => handleReview(item._id, 'approved')}
                      className="flex-1 lg:flex-none"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Approve
                    </Button>
                    <Button
                      variant="danger"
                      fullWidth
                      disabled={updating === item._id}
                      onClick={() => openRejectModal(item)}
                      className="flex-1 lg:flex-none"
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Reject Evidence">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Please provide feedback on why this evidence is being rejected so the student can improve and resubmit.
          </p>
          <Input
            label="Mentor Note"
            placeholder="e.g. Please provide a link to the actual repository instead of the deployed site."
            value={mentorNote}
            onChange={(e) => setMentorNote(e.target.value)}
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              loading={updating === selectedEvidence?._id}
              onClick={() => handleReview(selectedEvidence?._id, 'rejected', mentorNote)}
              disabled={!mentorNote.trim()}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
