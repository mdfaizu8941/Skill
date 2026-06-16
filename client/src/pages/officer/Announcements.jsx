import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card, { CardHeader } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'
import { getOfficerAnnouncements, sendOfficerAnnouncement } from '../../services/officerService'
import { extractMessage } from '../../services/api'

const emptyForm = {
  title: '',
  message: '',
  audienceType: 'all',
  recipientIds: '',
  sendInApp: true,
  sendEmail: false,
  branch: '',
  year: '',
  skills: '',
  minCgpa: '',
  maxCgpa: '',
  placementStatus: '',
  mentorAssigned: '',
}

const csvList = (value) => String(value || '').split(',').map((item) => item.trim()).filter(Boolean)

export default function Announcements() {
  const [form, setForm] = useState(emptyForm)
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await getOfficerAnnouncements()
      setAnnouncements(data.announcements || [])
    } catch (err) {
      setError(extractMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const send = async (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required')
      return
    }
    setSending(true)
    try {
      const { data } = await sendOfficerAnnouncement({
        title: form.title,
        message: form.message,
        audienceType: form.audienceType,
        recipientIds: csvList(form.recipientIds),
        sendInApp: form.sendInApp,
        sendEmail: form.sendEmail,
        filters: {
          branch: form.branch,
          year: form.year,
          skills: form.skills,
          minCgpa: form.minCgpa,
          maxCgpa: form.maxCgpa,
          placementStatus: form.placementStatus,
          mentorAssigned: form.mentorAssigned,
        },
      })
      toast.success(`Announcement sent to ${data.recipients} students`)
      setForm(emptyForm)
      load()
    } catch (err) {
      toast.error(extractMessage(err))
    } finally {
      setSending(false)
    }
  }

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={load} />

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Bulk Email & Notifications</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Send announcements to all, selected, eligible, or filtered students.</p>
      </div>

      <div className="grid xl:grid-cols-[420px_1fr] gap-6">
        <Card>
          <CardHeader title="New Announcement" subtitle="In-app notifications work immediately; email sends when SMTP is configured." />
          <form onSubmit={send} className="space-y-4">
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Message</label>
              <textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 resize-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Audience</label>
              <select value={form.audienceType} onChange={(e) => setForm({ ...form, audienceType: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                <option value="all">All students</option>
                <option value="selected">Selected student IDs</option>
                <option value="eligible">Eligible students</option>
                <option value="filtered">Filtered students</option>
              </select>
            </div>

            {form.audienceType === 'selected' && (
              <Input label="Student IDs" value={form.recipientIds} onChange={(e) => setForm({ ...form, recipientIds: e.target.value })} placeholder="Comma-separated user IDs" />
            )}

            {(form.audienceType === 'filtered' || form.audienceType === 'eligible') && (
              <div className="grid grid-cols-2 gap-3">
                <Input label="Branch" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} />
                <Input label="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
                <Input label="Skills" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
                <Input label="Min CGPA" value={form.minCgpa} onChange={(e) => setForm({ ...form, minCgpa: e.target.value })} />
                <Input label="Max CGPA" value={form.maxCgpa} onChange={(e) => setForm({ ...form, maxCgpa: e.target.value })} />
                <Input label="Status" value={form.placementStatus} onChange={(e) => setForm({ ...form, placementStatus: e.target.value })} />
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={form.sendInApp} onChange={(e) => setForm({ ...form, sendInApp: e.target.checked })} />
                In-app
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={form.sendEmail} onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })} />
                Email
              </label>
            </div>

            <Button type="submit" loading={sending} fullWidth><Send className="w-4 h-4" /> Send Announcement</Button>
          </form>
        </Card>

        <Card noPadding>
          <div className="p-6 pb-0"><CardHeader title="Notification History" subtitle="Announcements sent by placement officers" /></div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {announcements.length === 0 ? (
              <div className="py-16 text-center text-slate-500"><Megaphone className="w-10 h-10 mx-auto mb-2 opacity-40" />No announcements yet.</div>
            ) : announcements.map((item) => (
              <div key={item._id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.message}</p>
                  </div>
                  <Badge variant="info">{item.audienceType}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>{new Date(item.sentAt || item.createdAt).toLocaleString()}</span>
                  <span>{item.deliverySummary?.inAppCount || 0} in-app</span>
                  <span>{item.deliverySummary?.emailSent || 0} emails sent</span>
                  <span>{item.deliverySummary?.emailSkipped || 0} emails skipped</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </motion.div>
  )
}
