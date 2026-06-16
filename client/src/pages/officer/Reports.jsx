import { motion } from 'framer-motion'
import { Download, FileDown } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button'
import Card, { CardHeader } from '../../components/ui/Card'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'
import useAsync from '../../hooks/useAsync'
import { downloadOfficerReport, getOfficerReports } from '../../services/officerService'
import { extractMessage } from '../../services/api'

const reportTypes = [
  { type: 'students', title: 'Student Report', description: 'Branch, year, CGPA, placement status, and mentor mapping.' },
  { type: 'mentors', title: 'Mentor Assignment Report', description: 'Mentor load, evidence review, and performance statistics.' },
  { type: 'opportunities', title: 'Opportunity Participation Report', description: 'Opportunity status, deadlines, categories, and application counts.' },
]

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function Reports() {
  const { data, loading, error, reload } = useAsync(async () => {
    const res = await getOfficerReports()
    return res.data
  }, [])

  const download = async (type, format = 'csv') => {
    try {
      const res = await downloadOfficerReport(type, format)
      downloadBlob(res.data, `${type}-report.${format}`)
      toast.success('Report downloaded')
    } catch (err) {
      toast.error(extractMessage(err))
    }
  }

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={reload} />

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Download Reports</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Export placement data as CSV for Excel. Browser print can save these views as PDF.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card><p className="text-sm text-slate-500">Skills Tracked</p><p className="text-3xl font-bold mt-1">{data?.skillDistribution?.length || 0}</p></Card>
        <Card><p className="text-sm text-slate-500">Assigned Students</p><p className="text-3xl font-bold mt-1">{data?.mentorAssignment?.assignedStudents || 0}</p></Card>
        <Card><p className="text-sm text-slate-500">Opportunity Rows</p><p className="text-3xl font-bold mt-1">{data?.opportunityParticipation?.length || 0}</p></Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {reportTypes.map((report) => (
          <Card key={report.type} className="flex flex-col">
            <FileDown className="w-8 h-8 text-brand-600 dark:text-brand-400 mb-4" />
            <CardHeader title={report.title} subtitle={report.description} />
            <div className="mt-auto grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => download(report.type, 'csv')}><Download className="w-4 h-4" /> CSV</Button>
              <Button onClick={() => download(report.type, 'xls')}><Download className="w-4 h-4" /> Excel</Button>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  )
}
