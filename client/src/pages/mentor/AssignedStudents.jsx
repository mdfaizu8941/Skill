import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Mail, GraduationCap, X, Award, Target, TrendingUp, FileText, Phone, MapPin } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'
import useAsync from '../../hooks/useAsync'
import api from '../../services/api'
import { formatDate } from '../../utils/formatUtils'

export default function AssignedStudents() {
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [studentDetail, setStudentDetail] = useState(null)

  const { data, loading, error, reload } = useAsync(async () => {
    const res = await api.get('/mentor/students')
    return res.data.students || []
  }, [])

  const handleViewDetail = async (student) => {
    setSelectedStudent(student)
    setDetailLoading(true)
    try {
      const res = await api.get(`/mentor/students/${student.user._id}`)
      setStudentDetail(res.data)
    } catch (err) {
      console.error(err)
      setStudentDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCloseModal = () => {
    setSelectedStudent(null)
    setStudentDetail(null)
  }

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={reload} />

  const students = data || []

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Assigned Students</h1>

        {students.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">No students assigned yet.</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {students.map((item, i) => (
              <Card
                key={i}
                className="p-5 space-y-3 cursor-pointer hover:shadow-lg dark:hover:shadow-slate-900/50 transition-shadow"
                onClick={() => handleViewDetail(item)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                    {item.user?.name?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-200">{item.user?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{item.profile?.verificationStatus || 'pending'}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{item.user?.email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    <span>{item.profile?.university || 'University not set'}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </motion.div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                  {selectedStudent.user?.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {selectedStudent.user?.name || 'Unknown'}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{selectedStudent.user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailLoading ? (
                <Loader />
              ) : !studentDetail ? (
                <ErrorMessage message="Failed to load student details" />
              ) : (
                <>
                  {/* Overview Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" /> Overview
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <GraduationCap className="w-4 h-4" />
                          <span>{studentDetail.profile?.university || '—'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Phone className="w-4 h-4" />
                          <span>{studentDetail.profile?.phone || '—'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <MapPin className="w-4 h-4" />
                          <span>{studentDetail.profile?.location || '—'}</span>
                        </div>
                      </div>
                      <div className="text-sm space-y-2">
                        <p className="text-slate-600 dark:text-slate-400">
                          <span className="font-medium text-slate-900 dark:text-slate-200">Status:</span>{' '}
                          {studentDetail.profile?.verificationStatus || 'pending'}
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">
                          <span className="font-medium text-slate-900 dark:text-slate-200">Member since:</span>{' '}
                          {formatDate(studentDetail.user?.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5" /> Skills ({studentDetail.skills?.length || 0})
                    </h3>
                    {studentDetail.skills?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {studentDetail.skills.map((skill, idx) => (
                          <Badge key={idx} variant="primary">
                            {skill.skillName} · {skill.proficiency}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No skills added yet.</p>
                    )}
                  </div>

                  {/* Gap Analysis History */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5" /> Gap Analysis History
                    </h3>
                    {studentDetail.gapAnalyses?.length > 0 ? (
                      <div className="space-y-3">
                        {studentDetail.gapAnalyses.slice(0, 3).map((gap, idx) => (
                          <Card key={idx} className="p-4">
                            <p className="font-medium text-slate-900 dark:text-slate-200">
                              {gap.analysisMode === 'role' ? gap.roleId?.roleName : 'JD Analysis'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {formatDate(gap.createdAt)} · {gap.missingSkills?.length || 0} missing skills
                            </p>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No gap analyses yet.</p>
                    )}
                  </div>

                  {/* Roadmap Progress */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" /> Roadmap Progress
                    </h3>
                    {studentDetail.roadmaps?.length > 0 ? (
                      <div className="space-y-3">
                        {studentDetail.roadmaps.map((roadmap, idx) => (
                          <Card key={idx} className="p-4">
                            <p className="font-medium text-slate-900 dark:text-slate-200">{roadmap.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {roadmap.milestones?.filter((m) => m.completed).length || 0} /{' '}
                              {roadmap.milestones?.length || 0} milestones completed
                            </p>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No roadmaps created yet.</p>
                    )}
                  </div>

                  {/* Evidence Submissions */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" /> Evidence Submissions
                    </h3>
                    {studentDetail.evidences?.length > 0 ? (
                      <div className="space-y-3">
                        {studentDetail.evidences.slice(0, 5).map((ev, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                                {ev.skillId?.skillName || 'Unknown'}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(ev.createdAt)}</p>
                            </div>
                            <Badge variant={ev.status === 'approved' ? 'success' : ev.status === 'rejected' ? 'danger' : 'warning'}>
                              {ev.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No evidence submitted yet.</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <Button variant="ghost" onClick={handleCloseModal}>
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}