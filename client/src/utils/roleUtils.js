import { ROLES } from '../constants/roles'

export const normalizeRole = (role) => {
  const r = String(role || '').toLowerCase()
  if (r === 'mentor') return ROLES.MENTOR
  if (r === 'placementofficer') return ROLES.OFFICER
  if (r === 'admin') return ROLES.ADMIN
  return ROLES.STUDENT
}

export const getRoleDashboard = (role) => {
  const normalized = normalizeRole(role)
  switch (normalized) {
    case ROLES.STUDENT:
      return '/student/dashboard'
    case ROLES.MENTOR:
      return '/mentor/dashboard'
    case ROLES.OFFICER:
      return '/officer/dashboard'
    case ROLES.ADMIN:
      return '/admin/dashboard'
    default:
      return '/login'
  }
}

export const getRoleLabel = (role) => {
  const normalized = normalizeRole(role)
  switch (normalized) {
    case ROLES.STUDENT:
      return 'Student'
    case ROLES.MENTOR:
      return 'Mentor'
    case ROLES.OFFICER:
      return 'Placement Officer'
    case ROLES.ADMIN:
      return 'Admin'
    default:
      return 'Unknown'
  }
}

export const getRoleColor = (role) => {
  const normalized = normalizeRole(role)
  switch (normalized) {
    case ROLES.STUDENT:
      return 'bg-blue-500/20 text-blue-400'
    case ROLES.MENTOR:
      return 'bg-emerald-500/20 text-emerald-400'
    case ROLES.OFFICER:
      return 'bg-amber-500/20 text-amber-400'
    case ROLES.ADMIN:
      return 'bg-red-500/20 text-red-400'
    default:
      return 'bg-slate-500/20 text-slate-400'
  }
}
