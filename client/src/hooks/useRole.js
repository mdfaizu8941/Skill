import { useAuth } from '../context/AuthContext'
import { ROLES } from '../constants/roles'

export default function useRole() {
  const { role } = useAuth()

  return {
    role,
    isStudent: role === ROLES.STUDENT,
    isMentor: role === ROLES.MENTOR,
    isOfficer: role === ROLES.OFFICER,
    isAdmin: role === ROLES.ADMIN,
  }
}
