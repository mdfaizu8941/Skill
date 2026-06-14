import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
import useRole from '../../hooks/useRole'
import { getRoleDashboard } from '../../utils/roleUtils'

export default function NotFound() {
  const { role } = useRole()
  const dashboardUrl = role ? getRoleDashboard(role) : '/'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-950 min-h-screen">
      <FileQuestion className="w-20 h-20 text-slate-300 dark:text-slate-800 mb-6" />
      <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">404</h1>
      <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4">Page not found</h2>
      <p className="text-slate-500 dark:text-slate-500 max-w-sm mb-8">Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.</p>
      <Link to={dashboardUrl} className="px-6 py-2.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-500 transition-colors">
        Go to Dashboard
      </Link>
    </motion.div>
  )
}
