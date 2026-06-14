import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Loader from './Loader'

export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, authLoading, role } = useAuth()

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader text="Authenticating..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />
  }

  return children
}
