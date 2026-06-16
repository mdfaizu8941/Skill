import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useAuth } from '../../context/AuthContext'
import { extractMessage } from '../../services/api'
import { ROLES } from '../../constants/roles'
import { getRoleDashboard } from '../../utils/roleUtils'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: ROLES.STUDENT
    }
  })

  const password = watch('password')

  const onSubmit = async (formData) => {
    setLoading(true)
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      }
      const user = await registerUser(payload)
      toast.success('Account created successfully!')
      navigate(getRoleDashboard(user.role))
    } catch (err) {
      toast.error(extractMessage(err))
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Create Account</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Join SGIP to accelerate your career</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />

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

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Role
            </label>
            <select
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
              {...register('role', { required: 'Role is required' })}
            >
              <option value={ROLES.STUDENT}>Student</option>
              <option value={ROLES.MENTOR}>Mentor</option>
            </select>
            {errors.role && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.role.message}</p>}
          </div>

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

          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            {...register('confirmPassword', {
              required: 'Please confirm password',
              validate: value => value === password || 'Passwords do not match'
            })}
            error={errors.confirmPassword?.message}
          />

          <Button type="submit" fullWidth loading={loading} className="mt-6">
            Create Account <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 dark:text-brand-400 hover:text-brand-500 font-medium">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
