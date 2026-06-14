import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart2, FileText, Map, TrendingUp, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getRoleDashboard } from '../../utils/roleUtils'

const features = [
  {
    icon: BarChart2,
    title: 'Gap Analysis',
    desc: 'Identify exactly which skills you need for your target career role with AI-powered analysis.',
    tone: 'from-brand-500 to-indigo-600',
  },
  {
    icon: FileText,
    title: 'AI Resume Parser',
    desc: 'Upload your resume and let our AI extract and categorize your skills automatically.',
    tone: 'from-cyan-500 to-blue-600',
  },
  {
    icon: Map,
    title: 'Personalized Roadmap',
    desc: 'Get a step-by-step learning roadmap tailored to bridge your specific skill gaps.',
    tone: 'from-emerald-500 to-teal-600',
  },
  {
    icon: TrendingUp,
    title: 'Placement Analytics',
    desc: 'Track placement-readiness metrics and visualize your progress over time.',
    tone: 'from-amber-500 to-orange-600',
  },
]

export default function LandingPage() {
  const { user, token } = useAuth()
  if (token && user) {
    return <Navigate to={getRoleDashboard(user.role)} replace />
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-slate-950 text-slate-200"
    >
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-4 border-b border-slate-800/50">
        <span className="text-xl font-bold bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">
          SGIP
        </span>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-500 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-6xl font-extrabold leading-tight"
          >
            Bridge the gap between{' '}
            <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              your current skills
            </span>{' '}
            and your dream career role
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto"
          >
            SGIP combines intelligent gap analysis, AI resume parsing, personalized roadmaps, and a peer-to-peer skill barter system to accelerate your career readiness.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 flex items-center justify-center gap-4 flex-wrap"
          >
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-500 transition-all hover:shadow-lg hover:shadow-brand-600/25"
            >
              Login <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800 transition-colors"
            >
              Create Account
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold">Everything you need to get career-ready</h2>
          <p className="mt-3 text-slate-400">Four powerful tools working together to prepare you for placement.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="group relative rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-6 hover:border-slate-700 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.tone} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} SGIP — Skill Gap Intelligence Platform
      </footer>
    </motion.div>
  )
}
