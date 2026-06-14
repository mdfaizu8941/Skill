import { Route, Routes } from 'react-router-dom'
import OfficerDashboard from '../pages/officer/OfficerDashboard'
import Analytics from '../pages/officer/Analytics'
import Reports from '../pages/officer/Reports'
import StudentSearch from '../pages/officer/StudentSearch'

export default function OfficerRoutes() {
  return (
    <Routes>
      <Route path="dashboard" element={<OfficerDashboard />} />
      <Route path="analytics" element={<Analytics />} />
      <Route path="reports" element={<Reports />} />
      <Route path="student-search" element={<StudentSearch />} />
    </Routes>
  )
}
