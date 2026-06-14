import { Route, Routes } from 'react-router-dom'
import StudentDashboard from '../pages/student/StudentDashboard'
import MyProfile from '../pages/student/MyProfile'
import SkillsEvidence from '../pages/student/SkillsEvidence'
import CareerRoles from '../pages/student/CareerRoles'
import GapAnalysis from '../pages/student/GapAnalysis'
import Roadmap from '../pages/student/Roadmap'
import MentorDiscovery from '../pages/student/MentorDiscovery'
import ResumeParser from '../pages/student/ResumeParser'
import Notifications from '../pages/student/Notifications'
import MarketplacePage from '../pages/student/barter/MarketplacePage'
import MySkillsPage from '../pages/student/barter/MySkillsPage'
import PostSkillPage from '../pages/student/barter/PostSkillPage'
import ExchangeRequestsPage from '../pages/student/barter/ExchangeRequestsPage'
import ExchangeInboxPage from '../pages/student/barter/ExchangeInboxPage'
import ChatPage from '../pages/student/barter/ChatPage'
import RatingsPage from '../pages/student/barter/RatingsPage'
import AnalyticsPage from '../pages/student/barter/AnalyticsPage'

export default function StudentRoutes() {
  return (
    <Routes>
      <Route path="dashboard" element={<StudentDashboard />} />
      <Route path="profile" element={<MyProfile />} />
      <Route path="skills" element={<SkillsEvidence />} />
      <Route path="career-roles" element={<CareerRoles />} />
      <Route path="gap-analysis" element={<GapAnalysis />} />
      <Route path="roadmap" element={<Roadmap />} />
      <Route path="mentor-discovery" element={<MentorDiscovery />} />
      <Route path="resume-parser" element={<ResumeParser />} />
      <Route path="notifications" element={<Notifications />} />
      <Route path="barter/marketplace" element={<MarketplacePage />} />
      <Route path="barter/my-skills" element={<MySkillsPage />} />
      <Route path="barter/post-skill" element={<PostSkillPage />} />
      <Route path="barter/exchanges" element={<ExchangeRequestsPage />} />
      <Route path="barter/inbox" element={<ExchangeInboxPage />} />
      <Route path="barter/chat" element={<ChatPage />} />
      <Route path="barter/chat/:conversationId" element={<ChatPage />} />
      <Route path="barter/ratings" element={<RatingsPage />} />
      <Route path="barter/analytics" element={<AnalyticsPage />} />
    </Routes>
  )
}
