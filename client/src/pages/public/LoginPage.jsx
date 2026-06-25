import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useAuth } from '../../context/AuthContext'
import { showError } from '../../services/api'
import { getRoleDashboard } from '../../utils/roleUtils'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    }
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const user = await login(data)
      toast.success('Welcome back!')
      navigate(getRoleDashboard(user.role))
    } catch (err) {
      showError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8"
      >
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome Back</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Sign in to your SGIP account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="john@example.com"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            error={errors.email?.message}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            {...register('password', { 
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters'
              }
            })}
            error={errors.password?.message}
          />

          <Button type="submit" fullWidth loading={loading} className="mt-6">
            Sign In <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-brand-600 dark:text-brand-400 hover:text-brand-500 font-medium">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
