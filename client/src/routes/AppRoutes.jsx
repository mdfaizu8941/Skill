import { Routes, Route, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldAlert } from 'lucide-react'
import { ROLES } from '../constants/roles'
import useRole from '../hooks/useRole'
import { getRoleDashboard } from '../utils/roleUtils'
import PublicLayout from '../components/layout/PublicLayout'
import AppShell from '../components/layout/AppShell'
import ProtectedRoute from '../components/common/ProtectedRoute'
import NotFound from '../components/common/NotFound'
import LandingPage from '../pages/public/LandingPage'
import LoginPage from '../pages/public/LoginPage'
import RegisterPage from '../pages/public/RegisterPage'
import StudentRoutes from './StudentRoutes'
import MentorRoutes from './MentorRoutes'
import OfficerRoutes from './OfficerRoutes'
import AdminRoutes from './AdminRoutes'

function UnauthPage() {
  const { role } = useRole()
  const dashboardUrl = role ? getRoleDashboard(role) : '/'
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
      className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 text-slate-200"
    >
      <ShieldAlert className="w-16 h-16 text-red-400" />
      <h1 className="text-3xl font-bold">403 — Forbidden</h1>
      <p className="text-slate-400">You do not have permission to access this page.</p>
      <Link to={dashboardUrl} className="mt-4 px-6 py-2.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-500 transition-colors">Go to Dashboard</Link>
    </motion.div>
  )
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Student routes */}
      <Route
        path="/student/*"
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="*" element={<StudentRoutes />} />
      </Route>

      {/* Mentor routes */}
      <Route
        path="/mentor/*"
        element={
          <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="*" element={<MentorRoutes />} />
      </Route>

      {/* Officer routes */}
      <Route
        path="/officer/*"
        element={
          <ProtectedRoute allowedRoles={[ROLES.OFFICER]}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="*" element={<OfficerRoutes />} />
      </Route>

      {/* Admin routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="*" element={<AdminRoutes />} />
      </Route>

      {/* Forbidden */}
      <Route path="/403" element={<UnauthPage />} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
