import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import {
  Target,
  FileText,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Card, { CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'
import api from '../../services/api'
import { analyseGap, getGapReports } from '../../services/gapService'
import { generateRoadmap } from '../../services/roadmapService'

export default function GapAnalysis() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState('role')
  const [quickRoles, setQuickRoles] = useState([])
  const [targetRole, setTargetRole] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [analysing, setAnalysing] = useState(false)
  const [result, setResult] = useState(null)
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false)
  const [roadmapGenerated, setRoadmapGenerated] = useState(false)

  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [expandedReportId, setExpandedReportId] = useState(null)

  useEffect(() => {
    fetchQuickRoles()
    fetchHistory()
  }, [])
  useEffect(() => {
  if (location.state?.selectedRole) {
    setTargetRole(location.state.selectedRole)
    setMode('role')
  }
}, [location.state])

  const fetchQuickRoles = async () => {
    try {
      const { data } = await api.get('/career-roles')
      setQuickRoles((data.roles || []).slice(0, 5))    } catch (err) {
      console.error('Failed to load quick roles')
    }
  }

  const fetchHistory = async () => {
    try {
      const { data } = await getGapReports()
      setHistory(data.reports || [])
    } catch (err) {
      console.error('Failed to load history')
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleAnalyse = async () => {
    if (mode === 'role' && !targetRole.trim()) {
      toast.error('Please enter a target role')
      return
    }
    if (mode === 'jd' && jobDescription.length < 100) {
      toast.error('Job description must be at least 100 characters')
      return
    }

    setAnalysing(true)
    setResult(null)
    try {
      const payload =
        mode === 'role'
          ? { targetRole: targetRole.trim(), mode: 'role' }
          : { jobDescription: jobDescription.trim(), mode: 'jd' }

      const { data } = await analyseGap(payload)
      setResult(data.report)
      fetchHistory() // Refresh history
      toast.success('Analysis completed!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Analysis failed')
    } finally {
      setAnalysing(false)
    }
  }

  const handleGenerateRoadmap = async (reportData) => {
    if (!reportData?._id) return
    setGeneratingRoadmap(true)
    try {
      await api.post('/roadmap/generate', { gapReportId: reportData._id })
      setRoadmapGenerated(true)
      toast.success('Roadmap generated successfully')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to generate roadmap')
    } finally {
      setGeneratingRoadmap(false)
    }
  }

  const getScoreColor = (score) => {
    if (score < 40) return 'text-red-600 dark:text-red-400'
    if (score < 70) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  const getScoreBgColor = (score) => {
    if (score < 40) return 'bg-red-100 dark:bg-red-500/20'
    if (score < 70) return 'bg-yellow-100 dark:bg-yellow-500/20'
    return 'bg-green-100 dark:bg-green-500/20'
  }

  const renderResult = (reportData) => {
    if (!reportData) return null

    return (
      <Card className="mt-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {reportData.targetRole || 'Analysis Result'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Analysed on {new Date(reportData.generatedAt || reportData.createdAt || Date.now()).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-8 mb-6">
          <div
            className={`w-32 h-32 rounded-full flex flex-col items-center justify-center ${getScoreBgColor(
              reportData.compatibilityScore || 0
            )}`}
          >
            <span className={`text-4xl font-bold ${getScoreColor(reportData.compatibilityScore || 0)}`}>
              {(reportData.compatibilityScore || 0).toFixed(1)}%
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Compatibility Score
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="flex items-center gap-2 font-semibold text-green-600 dark:text-green-400 mb-4">
              <CheckCircle2 className="w-5 h-5" />
              Your Strengths
            </h4>
            <div className="flex flex-wrap gap-2">
              {(reportData.matchedSkills || []).length > 0 ? (
                reportData.matchedSkills.map((skill, i) => (
                  <Badge key={i} variant="success">
                    {typeof skill === 'object' ? skill.skillName : skill}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-500">No matched skills</p>
              )}
            </div>
          </div>
          <div>
            <h4 className="flex items-center gap-2 font-semibold text-red-600 dark:text-red-400 mb-4">
              <AlertTriangle className="w-5 h-5" />
              Skill Gaps
            </h4>
            <div className="flex flex-wrap gap-2">
              {(reportData.missingSkills || []).length > 0 ? (
                reportData.missingSkills.map((skill, i) => (
                  <Badge key={i} variant="danger">
                    {typeof skill === 'object' ? skill.skillName : skill}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-500">No skill gaps</p>
              )}
            </div>
          </div>
        </div>

        {reportData.explanation && (
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 mb-6">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-500" />
              AI Explanation
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {reportData.explanation}
            </p>
          </div>
        )}

        <button
          onClick={() => handleGenerateRoadmap(reportData)}
          disabled={generatingRoadmap}
          className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          {generatingRoadmap ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Roadmap'
          )}
        </button>

        {roadmapGenerated && (
          <p className="mt-3 text-green-400 text-sm">
            Roadmap generated!{' '}
            <a href="/student/roadmap" className="underline font-medium">
              View your Roadmap →
            </a>
          </p>
        )}
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gap Analysis</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Discover your skill gaps and get personalized recommendations
        </p>
      </div>

      {/* Section 1 - Mode Selector */}
      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={() => setMode('role')}
          className={`p-6 rounded-xl border-2 transition-all text-left ${
            mode === 'role'
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-300 dark:hover:border-purple-700'
          }`}
        >
          <Target
            className={`w-10 h-10 mb-3 ${
              mode === 'role' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'
            }`}
          />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Role-Based Analysis
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Type any job role and we'll analyse your fit
          </p>
        </button>

        <button
          onClick={() => setMode('jd')}
          className={`p-6 rounded-xl border-2 transition-all text-left ${
            mode === 'jd'
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-300 dark:hover:border-purple-700'
          }`}
        >
          <FileText
            className={`w-10 h-10 mb-3 ${
              mode === 'jd' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'
            }`}
          />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
            JD-Based Analysis
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Paste a job description for precise skill matching
          </p>
        </button>
      </div>

      {/* Section 2 - Analysis Input */}
      <Card>
        <CardHeader
          title={mode === 'role' ? 'Enter Target Role' : 'Paste Job Description'}
          subtitle={
            mode === 'role'
              ? 'Select from quick picks or type your own'
              : 'Provide the full job description for analysis'
          }
        />

        {mode === 'role' ? (
          <div className="space-y-4 mt-4">
            <input
              type="text"
              placeholder="e.g. Senior Cloud Engineer, ML Engineer, DevOps Lead"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
            />
            {quickRoles.length > 0 && (
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Quick Pick:</p>
                <div className="flex flex-wrap gap-2">
                  {quickRoles.map((role) => (
                    <button
                      key={role._id}
                      onClick={() => setTargetRole(role.title)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                    >
                      {role.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 mt-4">
            <textarea
              rows={10}
              minLength={100}
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 resize-none"
            />
            <div className="text-xs text-slate-500 dark:text-slate-500 text-right">
              {jobDescription.length} characters (min 100)
            </div>
          </div>
        )}

        <div className="mt-6">
          <Button onClick={handleAnalyse} disabled={analysing} className="w-full sm:w-auto">
            {analysing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analysing your profile with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyse
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Section 3 - Results */}
      {result && renderResult(result)}

      {/* Section 4 - Analysis History */}
      <Card>
        <CardHeader title="Previous Analyses" subtitle="View your past gap analysis reports" />

        {loadingHistory ? (
          <Loader text="Loading history..." />
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              No analyses yet. Run your first gap analysis above.
            </p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {history.map((report) => (
              <div
                key={report._id}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 dark:text-slate-200">
                      {report.targetRole || 'Analysis'}
                    </h4>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant={(report.compatibilityScore || 0) >= 70 ? 'success' : 'warning'}>
                        {(report.compatibilityScore || 0).toFixed(1)}% Match
                      </Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-500">
                        {new Date(report.generatedAt || report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setExpandedReportId(expandedReportId === report._id ? null : report._id)
                    }
                  >
                    {expandedReportId === report._id ? (
                      <>
                        Hide <ChevronUp className="w-4 h-4 ml-1" />
                      </>
                    ) : (
                      <>
                        View Results <ChevronDown className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
                {expandedReportId === report._id && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    {renderResult(report)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  )
}
