import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Check, X, Calendar, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'
import api from '../../services/api'

export default function MentorRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('pending')
  
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [declineNote, setDeclineNote] = useState('')
  const [responding, setResponding] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/mentor/requests')
      setRequests(data.requests || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (requestId) => {
    setResponding(true)
    try {
      await api.patch(`/mentor/requests/${requestId}`, { status: 'accepted' })
      setRequests(prev =>
        prev.map(r =>
          r._id === requestId
            ? { ...r, status: 'accepted', respondedAt: new Date() }
            : r
        )
      )
      toast.success('Request accepted! Student assigned to you.')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to accept request')
    } finally {
      setResponding(false)
    }
  }

  const openDeclineModal = (request) => {
    setSelectedRequest(request)
    setIsDeclineModalOpen(true)
  }

  const handleDecline = async () => {
    if (!selectedRequest) return
    
    setResponding(true)
    try {
      await api.patch(`/mentor/requests/${selectedRequest._id}`, {
        status: 'declined',
        mentorNote: declineNote.trim()
      })
      
      setRequests(prev =>
        prev.map(r =>
          r._id === selectedRequest._id
            ? { ...r, status: 'declined', respondedAt: new Date(), mentorNote: declineNote }
            : r
        )
      )
      
      toast.success('Request declined')
      setIsDeclineModalOpen(false)
      setDeclineNote('')
      setSelectedRequest(null)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to decline request')
    } finally {
      setResponding(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'S'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const filteredRequests = requests.filter(r => r.status === activeTab)

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={fetchRequests} />

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Connection Requests
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Manage student mentorship requests
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Pending ({requests.filter(r => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('accepted')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'accepted'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Accepted ({requests.filter(r => r.status === 'accepted').length})
        </button>
        <button
          onClick={() => setActiveTab('declined')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'declined'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Declined ({requests.filter(r => r.status === 'declined').length})
        </button>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-2">
            No {activeTab} requests
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            {activeTab === 'pending'
              ? 'New requests will appear here'
              : `No ${activeTab} requests yet`}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => (
            <Card key={request._id}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {request.studentId?.avatarUrl ? (
                    <img
                      src={request.studentId.avatarUrl}
                      alt={request.studentId.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(request.studentId?.name)
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-200">
                        {request.studentId?.name || 'Unknown Student'}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {request.studentId?.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500 flex-shrink-0">
                      <Calendar className="w-3 h-3" />
                      {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {request.message && (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 mb-3">
                      <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                        "{request.message}"
                      </p>
                    </div>
                  )}

                  {activeTab === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleAccept(request._id)}
                        loading={responding}
                      >
                        <Check className="w-4 h-4" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => openDeclineModal(request)}
                      >
                        <X className="w-4 h-4" />
                        Decline
                      </Button>
                    </div>
                  )}

                  {activeTab === 'accepted' && (
                    <Badge variant="success" className="flex items-center gap-1 w-fit">
                      <Check className="w-3 h-3" />
                      Assigned - {new Date(request.respondedAt).toLocaleDateString()}
                    </Badge>
                  )}

                  {activeTab === 'declined' && (
                    <div>
                      <Badge variant="danger" className="flex items-center gap-1 w-fit mb-2">
                        <X className="w-3 h-3" />
                        Declined - {new Date(request.respondedAt).toLocaleDateString()}
                      </Badge>
                      {request.mentorNote && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Your note: {request.mentorNote}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Decline Modal */}
      <Modal
        isOpen={isDeclineModalOpen}
        onClose={() => {
          setIsDeclineModalOpen(false)
          setDeclineNote('')
          setSelectedRequest(null)
        }}
        title="Decline Request"
        maxWidth="max-w-lg"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Declining request from <strong>{selectedRequest.studentId?.name}</strong>
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Note to student (optional)
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={declineNote}
                onChange={(e) => setDeclineNote(e.target.value)}
                placeholder="Explain why you're declining (optional)..."
                className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsDeclineModalOpen(false)
                  setDeclineNote('')
                  setSelectedRequest(null)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDecline}
                loading={responding}
                className="flex-1"
              >
                <X className="w-4 h-4" />
                Decline Request
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
