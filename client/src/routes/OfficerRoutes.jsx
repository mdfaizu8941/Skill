import { Route, Routes } from 'react-router-dom'
import OfficerDashboard from '../pages/officer/OfficerDashboard'
import Analytics from '../pages/officer/Analytics'
import Reports from '../pages/officer/Reports'
import StudentSearch from '../pages/officer/StudentSearch'
import EligibilityChecker from '../pages/officer/EligibilityChecker'
import MentorManagement from '../pages/officer/MentorManagement'
import OpportunityManagement from '../pages/officer/OpportunityManagement'
import Announcements from '../pages/officer/Announcements'
import OfficerChat from '../pages/officer/OfficerChat'
import ActivityLogs from '../pages/officer/ActivityLogs'
import OfficerNotifications from '../pages/officer/OfficerNotifications'

export default function OfficerRoutes() {
  return (
    <Routes>
      <Route path="dashboard" element={<OfficerDashboard />} />
      <Route path="students" element={<StudentSearch />} />
      <Route path="eligibility" element={<EligibilityChecker />} />
      <Route path="mentors" element={<MentorManagement />} />
      <Route path="opportunities" element={<OpportunityManagement />} />
      <Route path="announcements" element={<Announcements />} />
      <Route path="chat" element={<OfficerChat />} />
      <Route path="analytics" element={<Analytics />} />
      <Route path="reports" element={<Reports />} />
      <Route path="activity-logs" element={<ActivityLogs />} />
      <Route path="notifications" element={<OfficerNotifications />} />
    </Routes>
  )
}
