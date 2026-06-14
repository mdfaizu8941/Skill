import { motion } from 'framer-motion'
import { Users, Shield, Activity, Database } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import Card, { CardHeader } from '../../components/ui/Card'
import { useAuth } from '../../context/AuthContext'

export default function AdminDashboard() {
  const { user } = useAuth()

  // In a real app, this would be fetched from an admin dashboard API endpoint
  const stats = {
    totalUsers: 1245,
    activeExchanges: 450,
    rolesCount: 45,
    systemUptime: '99.9%',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Welcome back, {user?.name?.split(' ')[0] || 'Admin'} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Platform overview and management.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} tone="brand" />
        <StatCard title="Active Exchanges" value={stats.activeExchanges} icon={Activity} tone="emerald" />
        <StatCard title="Career Roles" value={stats.rolesCount} icon={Shield} tone="amber" />
        <StatCard title="System Uptime" value={stats.systemUptime} icon={Database} tone="cyan" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Recent Audit Logs" subtitle="Latest system and user actions" />
          <div className="space-y-4 mt-4">
            <div className="text-center py-8 text-slate-500 dark:text-slate-500">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Audit logs feature coming soon.</p>
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Platform Health" subtitle="System performance metrics" />
          <div className="space-y-4 mt-4">
            <div className="text-center py-8 text-slate-500 dark:text-slate-500">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Health metrics feature coming soon.</p>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  )
}
