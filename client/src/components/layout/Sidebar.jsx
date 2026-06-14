import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { sidebarConfig } from '../../constants/sidebarConfig'

function getIcon(name) {
  const Icon = LucideIcons[name]
  return Icon || LucideIcons.Circle
}

export default function Sidebar({ open, onClose, collapsed, onToggleCollapse }) {
  const { role } = useAuth()
  const location = useLocation()
  const groups = sidebarConfig[role] || []

  const navContent = (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
      {groups.map((group) => (
        <div key={group.group}>
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">
              {group.group}
            </p>
          )}
          <ul className="space-y-1">
            {group.items.map((item) => {
              const Icon = getIcon(item.icon)
              const isActive = location.pathname === item.path
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${collapsed ? 'px-0 justify-center' : 'px-3'} ${isActive
                        ? 'bg-brand-50 dark:bg-brand-600/20 text-brand-600 dark:text-brand-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                  >
                    <Icon className={`flex-shrink-0 ${collapsed ? 'w-6 h-6' : 'w-5 h-5'} ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'
          }`}
      >
        <div className={`h-16 flex items-center border-b border-slate-200 dark:border-slate-800 ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {!collapsed && (
            <span className="text-lg font-bold bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">
              Skill Gap Intelligence
            </span>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        {navContent}
      </aside>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 lg:hidden"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
                <span className="text-lg font-bold bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">
                  Skill Gap Intelligence
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {navContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
