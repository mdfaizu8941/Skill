import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Search, Link as LinkedinIcon, Send, Check, X, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'
import api from '../../services/api'

export default function MentorDiscovery() {
  const [mentors, setMentors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [expertiseFilter, setExpertiseFilter] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState('')
  
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [selectedMentor, setSelectedMentor] = useState(null)
  const [requestMessage, setRequestMessage] = useState('')
  const [sendingRequest, setSendingRequest] = useState(false)

  useEffect(() => {
    fetchMentors()
  }, [search, expertiseFilter, availabilityFilter])

  const fetchMentors = async () => {
    try {
      setLoading(true)
      const params = {}
      if (search) params.search = search
      if (expertiseFilter) params.expertise = expertiseFilter
      if (availabilityFilter) params.availability = availabilityFilter
      
      const { data } = await api.get('/mentors', { params })
      setMentors(data.mentors || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load mentors')
    } finally {
      setLoading(false)
    }
  }

  const handleSendRequest = async () => {
    if (!selectedMentor) return
    
    setSendingRequest(true)
    try {
      await api.post(`/mentors/${selectedMentor._id}/request`, {
        message: requestMessage.trim()
      })
      
      // Update mentor's request status in UI
      setMentors(prev =>
        prev.map(m =>
          m._id === selectedMentor._id ? { ...m, requestStatus: 'pending' } : m
        )
      )
      
      toast.success('Connection request sent successfully!')
      setIsRequestModalOpen(false)
      setRequestMessage('')
      setSelectedMentor(null)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send request')
    } finally {
      setSendingRequest(false)
    }
  }

  const openRequestModal = (mentor) => {
    setSelectedMentor(mentor)
    setIsRequestModalOpen(true)
  }

  const getStatusBadge = (status) => {
    if (status === 'pending')
      return (
        <Badge variant="warning" className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Request Sent
        </Badge>
      )
    if (status === 'accepted')
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <Check className="w-3 h-3" />
          Connected
        </Badge>
      )
    if (status === 'declined')
      return (
        <Badge variant="danger" className="flex items-center gap-1">
          <X className="w-3 h-3" />
          Declined
        </Badge>
      )
    return null
  }

  const getInitials = (name) => {
    if (!name) return 'M'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading && mentors.length === 0) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={fetchMentors} />

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Find a Mentor</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Connect with experienced mentors to guide your learning journey
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>
          <input
            type="text"
            placeholder="Filter by expertise..."
            value={expertiseFilter}
            onChange={(e) => setExpertiseFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            <option value="">All Availability</option>
            <option value="accepting">Accepting</option>
            <option value="not_accepting">Not Accepting</option>
          </select>
        </div>
      </Card>

      {/* Mentors Grid */}
      {mentors.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-2">
            No mentors found
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Try adjusting your filters to find mentors
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mentors.map((mentor) => (
            <Card key={mentor._id} className="flex flex-col">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {mentor.avatarUrl ? (
                    <img
                      src={mentor.avatarUrl}
                      alt={mentor.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(mentor.name)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-200 truncate">
                    {mentor.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {mentor.availability === 'accepting' ? (
                      <Badge variant="success">Accepting Students</Badge>
                    ) : (
                      <Badge variant="warning">Not Accepting</Badge>
                    )}
                  </div>
                </div>
              </div>

              {mentor.bio && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
                  {mentor.bio}
                </p>
              )}

              {mentor.expertiseAreas && mentor.expertiseAreas.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {mentor.expertiseAreas.slice(0, 4).map((area, i) => (
                    <Badge key={i} variant="brand" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                  {mentor.expertiseAreas.length > 4 && (
                    <Badge variant="default" className="text-xs">
                      +{mentor.expertiseAreas.length - 4} more
                    </Badge>
                  )}
                </div>
              )}

              <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                {mentor.linkedinUrl && (
                  <a
                    href={mentor.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 dark:text-brand-400 hover:underline text-sm flex items-center gap-1"
                  >
                    <LinkedinIcon className="w-4 h-4" />
                    LinkedIn
                  </a>
                )}
                
                {mentor.requestStatus ? (
                  getStatusBadge(mentor.requestStatus)
                ) : (
                  <Button
                    size="sm"
                    onClick={() => openRequestModal(mentor)}
                    disabled={mentor.availability !== 'accepting'}
                    className="ml-auto"
                  >
                    <Send className="w-4 h-4" />
                    Send Request
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Request Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => {
          setIsRequestModalOpen(false)
          setRequestMessage('')
          setSelectedMentor(null)
        }}
        title="Send Connection Request"
        maxWidth="max-w-lg"
      >
        {selectedMentor && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                {getInitials(selectedMentor.name)}
              </div>
              <div>
                <h4 className="font-medium text-slate-900 dark:text-slate-200">
                  {selectedMentor.name}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {selectedMentor.email}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Message (optional)
              </label>
              <textarea
                rows={4}
                maxLength={500}
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Introduce yourself and explain why you'd like this mentor..."
                className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 resize-none"
              />
              <div className="text-xs text-slate-500 dark:text-slate-500 text-right mt-1">
                {requestMessage.length} / 500
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsRequestModalOpen(false)
                  setRequestMessage('')
                  setSelectedMentor(null)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleSendRequest} loading={sendingRequest} className="flex-1">
                <Send className="w-4 h-4" />
                Send Request
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
