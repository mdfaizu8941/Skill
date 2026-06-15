import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Map, CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import api from '../../services/api'
import useAsync from '../../hooks/useAsync'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'

export default function Roadmap() {
  const [updating, setUpdating] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [roadmap, setRoadmap] = useState(null)

  const { data: roadmaps, loading, error, reload } = useAsync(async () => {
    const { data } = await api.get('/roadmap/my')
    return data.roadmaps || []
  }, [])

  useEffect(() => {
    if (roadmaps && roadmaps.length > 0) {
      setRoadmap(roadmaps[selectedIndex] || roadmaps[0])
    } else if (roadmaps && roadmaps.length === 0) {
      setRoadmap(null)
    }
  }, [roadmaps, selectedIndex])

  const handleToggleStep = async (stepId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    
    // optimistic update — update UI immediately without refetch
    setRoadmap(prev => ({
      ...prev,
      steps: prev.steps?.map(s => 
        s._id === stepId ? { ...s, status: newStatus } : s
      )
    }))
    
    try {
      setUpdating(stepId)
      await api.patch(`/roadmap/steps/${stepId}`, { status: newStatus })
    } catch (err) {
      // revert on failure
      setRoadmap(prev => ({
        ...prev,
        steps: prev.steps?.map(s =>
          s._id === stepId ? { ...s, status: currentStatus } : s
        )
      }))
      console.error(err)
    } finally {
      setUpdating(null)
    }
  }

  if (loading && !roadmap) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={reload} />

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Learning Roadmap</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Your personalized path to mastering your target role.
        </p>
      </div>

      {roadmaps && roadmaps.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {roadmaps.map((rm, idx) => (
            <button
              key={rm._id}
              onClick={() => setSelectedIndex(idx)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedIndex === idx 
                  ? 'bg-brand-500 text-white shadow-md' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              🎯 {rm.careerRoleId?.title || 'Target Role'}
            </button>
          ))}
        </div>
      )}

      {!roadmap ? (
        <Card className="text-center py-16">
          <Map className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-2">No roadmap generated</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
            You need to run a Gap Analysis first to generate a personalized learning roadmap.
          </p>
          <Link to="/student/gap-analysis">
            <Button>
              Go to Gap Analysis <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-brand-500 before:to-brand-500/10 before:rounded-full">
          {roadmap.steps?.map((step, index) => {
            const isCompleted = step.status === 'completed'
            const isUpdating = updating === step._id

            return (
              <div key={step._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-950 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </div>

                <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-brand-600 dark:text-brand-400">Step {index + 1}</span>
                      </div>
                      <h4 className="text-base font-semibold text-slate-900 dark:text-slate-200">{step.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <Button
                      variant={isCompleted ? 'secondary' : 'primary'}
                      size="sm"
                      loading={isUpdating}
                      onClick={() => handleToggleStep(step._id, step.status)}
                    >
                      {isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
                    </Button>
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
