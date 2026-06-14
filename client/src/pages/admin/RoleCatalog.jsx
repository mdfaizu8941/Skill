import { motion } from 'framer-motion'
import { Layers } from 'lucide-react'
import Card from '../../components/ui/Card'

export default function RoleCatalog() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Role Catalog</h1>
      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <Layers className="w-12 h-12 text-slate-600 mb-4" />
        <p className="text-slate-400">Define and manage industry career roles and required skills.</p>
      </Card>
    </motion.div>
  )
}
