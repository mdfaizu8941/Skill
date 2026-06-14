import { Route, Routes } from 'react-router-dom'
import MentorDashboard from '../pages/mentor/MentorDashboard'
import MentorProfile from '../pages/mentor/MentorProfile'
import MentorRequests from '../pages/mentor/MentorRequests'
import EvidenceReview from '../pages/mentor/EvidenceReview'
import AssignedStudents from '../pages/mentor/AssignedStudents'
import MentorNotifications from '../pages/mentor/MentorNotifications'

export default function MentorRoutes() {
  return (
    <Routes>
      <Route path="dashboard" element={<MentorDashboard />} />
      <Route path="profile" element={<MentorProfile />} />
      <Route path="requests" element={<MentorRequests />} />
      <Route path="evidence-review" element={<EvidenceReview />} />
      <Route path="students" element={<AssignedStudents />} />
      <Route path="notifications" element={<MentorNotifications />} />
    </Routes>
  )
}
