import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Search, Edit2, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import api, { extractMessage } from '../../services/api'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'
import { ROLES } from '../../constants/roles'
import Modal from '../../components/ui/Modal'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [newRole, setNewRole] = useState('')
  const [updating, setUpdating] = useState(false)

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users')
      setUsers(data.users || [])
    } catch (err) {
      setError(extractMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return
    setUpdating(true)
    try {
      await api.patch(`/admin/users/${selectedUser._id}/role`, { role: newRole })
      toast.success('User role updated successfully')
      setRoleModalOpen(false)
      fetchUsers()
    } catch (err) {
      toast.error(extractMessage(err))
    } finally {
      setUpdating(false)
    }
  }

  const openRoleModal = (user) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setRoleModalOpen(true)
  }

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={fetchUsers} />

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage system users and their roles.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
                          {u.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-200">{u.name}</p>
                          <p className="text-slate-500 dark:text-slate-500 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={u.role === 'Admin' ? 'danger' : u.role === 'Student' ? 'brand' : 'success'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openRoleModal(u)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={roleModalOpen} onClose={() => setRoleModalOpen(false)} title="Change User Role">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg mb-4">
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-lg">
              {selectedUser?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-200">{selectedUser?.name}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{selectedUser?.email}</p>
            </div>
          </div>
          
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            New Role
          </label>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {Object.values(ROLES).map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setRoleModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              loading={updating}
              onClick={handleUpdateRole}
              disabled={newRole === selectedUser?.role}
            >
              Update Role
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
