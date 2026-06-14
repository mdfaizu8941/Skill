import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import Footer from './Footer'

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sgip_sidebar_collapsed') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('sgip_sidebar_collapsed', collapsed)
  }, [collapsed])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 flex transition-colors duration-200">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
      />

      <div className={`flex-1 flex flex-col transition-all duration-300 ml-0 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <TopBar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  )
}
