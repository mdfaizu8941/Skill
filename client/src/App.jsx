import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid #334155',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#e2e8f0' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#e2e8f0' },
            },
          }}
        />
        <AppRoutes />
      </NotificationProvider>
    </AuthProvider>
  )
}
