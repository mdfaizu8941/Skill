import { Route, Routes } from 'react-router-dom'
import AdminDashboard from '../pages/admin/AdminDashboard'
import UserManagement from '../pages/admin/UserManagement'
import AuditLogs from '../pages/admin/AuditLogs'
import RoleCatalog from '../pages/admin/RoleCatalog'

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="users" element={<UserManagement />} />
      <Route path="audit-logs" element={<AuditLogs />} />
      <Route path="role-catalog" element={<RoleCatalog />} />
    </Routes>
  )
}
