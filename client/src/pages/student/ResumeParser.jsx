import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import Card, { CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Loader from '../../components/common/Loader'
import api, { extractMessage } from '../../services/api'

export default function ResumeParser() {
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [skills, setSkills] = useState([])
  const [confirmed, setConfirmed] = useState(false)
  const inputRef = useRef(null)

  const handleFile = (f) => {
    if (f && f.type === 'application/pdf') {
      setFile(f)
      setSkills([])
      setConfirmed(false)
    } else {
      toast.error('Please upload a PDF file')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const parse = async () => {
    if (!file) return
    setParsing(true)
    try {
      const formData = new FormData()
      formData.append('resume', file)
      const { data } = await api.post('/resume/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSkills(data.skills || [])
      toast.success('Resume parsed successfully!')
    } catch (err) {
      toast.error(extractMessage(err))
    } finally {
      setParsing(false)
    }
  }

  const removeSkill = (index) => setSkills((p) => p.filter((_, i) => i !== index))

  const confirmSkills = async () => {
    try {
      await api.post('/skills/bulk', { skills })
      setConfirmed(true)
      toast.success('Skills saved to your profile!')
    } catch (err) {
      toast.error(extractMessage(err))
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Resume Parser</h1>
      <Card>
        <CardHeader title="Upload Resume" subtitle="Upload your resume PDF and let AI extract your skills." />
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !parsing && inputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-xl p-12 text-center transition-colors ${dragging ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/30'} ${parsing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} disabled={parsing} />
          <Upload className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
          <p className="text-slate-700 dark:text-slate-300 font-medium">{file ? file.name : 'Drag & drop your PDF here, or click to browse'}</p>
          <p className="text-xs text-slate-500 mt-1">PDF files only, max 10MB</p>
        </div>
        {file && !parsing && (
          <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-brand-600 dark:text-brand-400" /><span className="text-sm text-slate-700 dark:text-slate-300">{file.name}</span></div>
            <div className="flex items-center gap-2">
              <Button onClick={parse} disabled={parsing} size="sm">{parsing ? 'Parsing...' : 'Parse Resume'}</Button>
              <button type="button" onClick={() => { setFile(null); setSkills([]) }} disabled={parsing} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><X className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </Card>
      
      {parsing && (
        <Card className="text-center py-12">
          <Loader />
          <p className="text-slate-600 dark:text-slate-400 mt-4">Extracting skills with AI... This might take a few moments.</p>
        </Card>
      )}

      {skills.length > 0 && !confirmed && !parsing && (
        <Card>
          <CardHeader title="Extracted Skills" subtitle="Review and confirm the skills extracted from your resume." />
          <div className="flex flex-wrap gap-2 mb-6 mt-4">
            {skills.map((skill, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 text-sm font-medium border border-brand-200 dark:border-brand-500/30 group">
                {typeof skill === 'string' ? skill : skill.name || skill.skillName}
                <button type="button" onClick={() => removeSkill(i)} className="opacity-50 hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <Button onClick={confirmSkills}><Check className="w-4 h-4 mr-2" /> Confirm & Save Skills</Button>
        </Card>
      )}
      
      {confirmed && (
        <Card className="text-center py-8">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-slate-900 dark:text-slate-200 text-lg font-medium">Skills saved successfully!</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">You can view them in your Profile.</p>
        </Card>
      )}
    </motion.div>
  )
}
