import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ScrollText, ChevronLeft, ChevronRight } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'
import api from '../../services/api'

const ACTION_COLORS = {
  USER_REGISTERED: 'success',
  USER_LOGIN: 'info',
  CAREER_ROLE_CREATED: 'success',
  CAREER_ROLE_UPDATED: 'warning',
  CAREER_ROLE_DELETED: 'danger',
  GAP_ANALYSIS_RUN: 'info',
  ROADMAP_GENERATED: 'success',
  RESUME_PARSED: 'info',
  SKILL_EVIDENCE_SUBMITTED: 'info',
  MENTOR_REQUEST_SENT: 'info',
  MENTOR_REQUEST_ACCEPTED: 'success',
  MENTOR_REQUEST_DECLINED: 'danger',
  PROFILE_UPDATED: 'default',
  AVATAR_UPDATED: 'default',
  ROLE_CHANGED: 'warning',
  USER_ACTIVATED: 'success',
  USER_DEACTIVATED: 'danger',
  EVIDENCE_REVIEWED: 'info',
  SYSTEM_ERROR: 'danger',
  DEFAULT: 'default'
}

const getActionVariant = (action) => ACTION_COLORS[action] || ACTION_COLORS.DEFAULT

export default function AuditLogs() {
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page, limit: 20 })
      if (actionFilter) params.append('action', actionFilter)
      if (roleFilter) params.append('actorRole', roleFilter)
      const res = await api.get(`/admin/audit-logs?${params}`)
      setLogs(res.data.logs || [])
      setPagination(res.data.pagination || {})
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, actionFilter, roleFilter])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Audit Logs</h1>
          <p className="text-slate-400 mt-1">Immutable system activity trail.</p>
        </div>
        <div className="flex gap-3">
          <select
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            <option value="">All Actions</option>
            <option value="USER_REGISTERED">User Registered</option>
            <option value="USER_LOGIN">User Login</option>
            <option value="CAREER_ROLE_CREATED">Role Created</option>
            <option value="CAREER_ROLE_UPDATED">Role Updated</option>
            <option value="CAREER_ROLE_DELETED">Role Deleted</option>
            <option value="GAP_ANALYSIS_RUN">Gap Analysis Run</option>
            <option value="ROADMAP_GENERATED">Roadmap Generated</option>
            <option value="RESUME_PARSED">Resume Parsed</option>
            <option value="SKILL_EVIDENCE_SUBMITTED">Evidence Submitted</option>
            <option value="MENTOR_REQUEST_SENT">Mentor Request Sent</option>
            <option value="MENTOR_REQUEST_ACCEPTED">Mentor Request Accepted</option>
            <option value="MENTOR_REQUEST_DECLINED">Mentor Request Declined</option>
            <option value="PROFILE_UPDATED">Profile Updated</option>
            <option value="AVATAR_UPDATED">Avatar Updated</option>
            <option value="ROLE_CHANGED">Role Changed</option>
            <option value="USER_ACTIVATED">User Activated</option>
            <option value="USER_DEACTIVATED">User Deactivated</option>
            <option value="EVIDENCE_REVIEWED">Evidence Reviewed</option>
            <option value="SYSTEM_ERROR">System Error</option>
          </select>
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Mentor">Mentor</option>
            <option value="Student">Student</option>
            <option value="PlacementOfficer">Officer</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchLogs} />
      ) : (
        <>
          <Card noPadding>
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ScrollText className="w-12 h-12 text-slate-600 mb-4" />
                <p className="text-slate-400">No audit logs found.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {logs.map((log, i) => (
                  <div key={i} className="p-4 hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-brand-400 mt-2 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-slate-200">
                              {log.actorId?.name || 'System'}
                            </span>
                            <span className="text-xs text-slate-500">
                              {log.actorId?.email || ''}
                            </span>
                            <Badge variant={getActionVariant(log.action)}>
                              {log.action}
                            </Badge>
                            <Badge variant="default">{log.actorRole}</Badge>
                          </div>
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <p className="text-xs text-slate-500 mt-1">
                              {JSON.stringify(log.metadata).slice(0, 120)}
                            </p>
                          )}
                          <p className="text-xs text-slate-600 mt-1">
                            IP: {log.ip || 'unknown'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Page {pagination.page} of {pagination.pages} — {pagination.total} total logs
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}