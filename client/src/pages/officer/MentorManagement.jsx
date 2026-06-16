import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRightLeft, Star, UserCheck, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card, { CardHeader } from '../../components/ui/Card'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'
import { assignOfficerMentor, getOfficerMentors, getOfficerStudents } from '../../services/officerService'
import { extractMessage } from '../../services/api'

export default function MentorManagement() {
  const [mentors, setMentors] = useState([])
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedMentor, setSelectedMentor] = useState('')
  const [progressStatus, setProgressStatus] = useState('active')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [mentorRes, studentRes] = await Promise.all([
        getOfficerMentors(),
        getOfficerStudents({ limit: 100 }),
      ])
      setMentors(mentorRes.data.mentors || [])
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

  const selectedStudentRecord = useMemo(() => students.find((student) => student.id === selectedStudent), [students, selectedStudent])

  const assignMentor = async () => {
    if (!selectedStudent || !selectedMentor) {
      toast.error('Select a student and mentor')
      return
    }
    setSaving(true)
    try {
      await assignOfficerMentor({ studentId: selectedStudent, mentorId: selectedMentor, progressStatus, notes })
      toast.success(selectedStudentRecord?.mentor ? 'Mentor reassigned' : 'Mentor assigned')
      setSelectedStudent('')
      setSelectedMentor('')
      setNotes('')
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Mentor Management</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Assign mentors, review mappings, and monitor mentorship performance.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card><p className="text-sm text-slate-500">Mentors</p><p className="text-3xl font-bold mt-1">{mentors.length}</p></Card>
        <Card><p className="text-sm text-slate-500">Assigned Students</p><p className="text-3xl font-bold mt-1">{students.filter((student) => student.mentorAssigned).length}</p></Card>
        <Card><p className="text-sm text-slate-500">Unassigned Students</p><p className="text-3xl font-bold mt-1">{students.filter((student) => !student.mentorAssigned).length}</p></Card>
      </div>

      <Card>
        <CardHeader title="Assign or Reassign Mentor" subtitle="Changing a mentor sends notifications to both users." />
        <div className="grid lg:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Student</label>
            <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
              <option value="">Select student</option>
              {students.map((student) => <option key={student.id} value={student.id}>{student.name} {student.mentor?.name ? `(current: ${student.mentor.name})` : ''}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mentor</label>
            <select value={selectedMentor} onChange={(e) => setSelectedMentor(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
              <option value="">Select mentor</option>
              {mentors.map((mentor) => <option key={mentor._id} value={mentor._id}>{mentor.name} - {mentor.assignedCount} students</option>)}
            </select>
          </div>
          <Button onClick={assignMentor} loading={saving}><ArrowRightLeft className="w-4 h-4" /> Assign</Button>
        </div>
        <div className="grid md:grid-cols-[220px_1fr] gap-3 mt-3">
          <select value={progressStatus} onChange={(e) => setProgressStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
            <option value="active">Active</option>
            <option value="needs_attention">Needs attention</option>
            <option value="completed">Completed</option>
          </select>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Mentorship note" className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200" />
        </div>
      </Card>

      <Card noPadding>
        <div className="p-6 pb-0"><CardHeader title="Mentor Performance" subtitle="Assignment load, evidence review, and rating statistics" /></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-500 bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left font-medium">Mentor</th>
                <th className="px-6 py-4 text-left font-medium">Expertise</th>
                <th className="px-6 py-4 text-center font-medium">Students</th>
                <th className="px-6 py-4 text-center font-medium">Evidence</th>
                <th className="px-6 py-4 text-center font-medium">Pending</th>
                <th className="px-6 py-4 text-right font-medium">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {mentors.map((mentor) => (
                <tr key={mentor._id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">{mentor.name?.charAt(0)}</div>
                      <div><p className="font-medium">{mentor.name}</p><p className="text-xs text-slate-500">{mentor.email}</p></div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><div className="flex flex-wrap gap-1">{(mentor.expertiseAreas || []).slice(0, 3).map((item) => <Badge key={item}>{item}</Badge>)}</div></td>
                  <td className="px-6 py-4 text-center"><Badge variant="info"><Users className="w-3 h-3 mr-1" />{mentor.assignedCount}</Badge></td>
                  <td className="px-6 py-4 text-center">{mentor.evidenceReviewed}</td>
                  <td className="px-6 py-4 text-center">{mentor.pendingEvidence}</td>
                  <td className="px-6 py-4 text-right"><Badge variant="warning"><Star className="w-3 h-3 mr-1" />{mentor.averageRating || 0}</Badge></td>
                </tr>
              ))}
              {mentors.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500"><UserCheck className="w-10 h-10 mx-auto mb-2 opacity-40" />No mentors found.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  )
}
