import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import Card from '../../components/ui/Card'

export default function StudentSearch() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Student Search</h1>
      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <Search className="w-12 h-12 text-slate-600 mb-4" />
        <p className="text-slate-400">Search students by name, skills, or placement status.</p>
      </Card>
    </motion.div>
  )
}
