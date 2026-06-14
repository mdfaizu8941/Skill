import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Briefcase, Star, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import api from '../../services/api'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'

export default function CareerRoles() {
  const [searchTerm, setSearchTerm] = useState('')
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const { data } = await api.get('/career-roles')
        setRoles(data.careerRoles || [])
      } catch (err) {
        setError('Failed to load career roles.')
      } finally {
        setLoading(false)
      }
    }
    fetchRoles()
  }, [])

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} />

  const filteredRoles = roles.filter(role => 
    role.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Career Roles</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Explore target roles and discover the skills you need.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      {filteredRoles.length === 0 ? (
        <Card className="text-center py-12">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-40 text-slate-400 dark:text-slate-500" />
          <p className="text-lg font-medium text-slate-900 dark:text-slate-200">No roles found</p>
          <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">Try adjusting your search criteria.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map(role => (
            <Card key={role._id} className="flex flex-col h-full hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="w-12 h-12 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl flex items-center justify-center mb-4">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{role.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
                  {role.description}
                </p>
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {role.requiredSkills?.slice(0, 5).map((skill, idx) => (
                      <Badge key={idx} variant="default">{skill.title}</Badge>
                    ))}
                    {role.requiredSkills?.length > 5 && (
                      <Badge variant="default">+{role.requiredSkills.length - 5} more</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-800">
                <Link to="/student/gap-analysis">
                  <Button variant="ghost" fullWidth className="justify-between">
                    <span>Analyze Match</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  )
}
