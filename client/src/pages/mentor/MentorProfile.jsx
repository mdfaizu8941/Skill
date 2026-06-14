import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { Save, Camera, Upload, Users, Calendar, Link as LinkedinIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import Card, { CardHeader } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'
import { useAuth } from '../../context/AuthContext'
import { getMyProfile, updateMyProfile, uploadAvatar } from '../../services/profileService'
import api from '../../services/api'

export default function MentorProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [assignedCount, setAssignedCount] = useState(0)
  
  // Avatar upload state
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm()

  const bio = watch('bio', '')
  const expertiseAreas = watch('expertiseAreas', '')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [profileRes, studentsRes] = await Promise.all([
        getMyProfile(),
        api.get('/mentor/students'),
      ])
      const userData = profileRes.data.user || profileRes.data.profile
      setProfile(userData)
      setAssignedCount(studentsRes.data.students?.length || 0)
      reset({
        name: userData.name || '',
        email: userData.email || '',
        bio: userData.bio || '',
        expertiseAreas: (userData.expertiseAreas || []).join(', '),
        linkedinUrl: userData.linkedinUrl || '',
        availability: userData.availability || 'accepting',
      })
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const res = await updateMyProfile({
        name: data.name,
        bio: data.bio,
        expertiseAreas: data.expertiseAreas.split(',').map((s) => s.trim()).filter(Boolean),
        linkedinUrl: data.linkedinUrl,
        availability: data.availability,
      })
      setProfile(res.data.user || res.data.profile)
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) return

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', avatarFile)
      const res = await uploadAvatar(formData)
      setProfile({ ...profile, avatarUrl: res.data.avatarUrl })
      setAvatarFile(null)
      setAvatarPreview(null)
      toast.success('Avatar updated successfully!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'M'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) return <Loader />
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Avatar & Account Info */}
        <div className="space-y-6">
          {/* Profile Photo */}
          <Card>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative group">
                <div className="w-30 h-30 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                  {avatarPreview || profile?.avatarUrl ? (
                    <img
                      src={avatarPreview || profile.avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-slate-600 dark:text-slate-400">
                      {getInitials(profile?.name)}
                    </span>
                  )}
                </div>
                <label
                  htmlFor="avatar-input"
                  className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="w-6 h-6 text-white mb-1" />
                  <span className="text-xs text-white font-medium">Change Photo</span>
                </label>
                <input
                  id="avatar-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              {avatarFile && (
                <Button
                  size="sm"
                  onClick={handleAvatarUpload}
                  loading={uploadingAvatar}
                  className="w-full"
                >
                  <Upload className="w-4 h-4" />
                  Upload Avatar
                </Button>
              )}
            </div>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader title="Account Information" />
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Role</span>
                <Badge variant="brand">Mentor</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Status</span>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Assigned Students</span>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-200">
                  {assignedCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Member Since</span>
                <span className="text-sm text-slate-900 dark:text-slate-200">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Profile Form */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Personal Information" subtitle="Update your mentor profile details" />
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
              <Input
                label="Full Name"
                error={errors.name?.message}
                {...register('name', { required: 'Full name is required' })}
              />
              <Input
                label="Email"
                type="email"
                disabled
                className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed"
                error={errors.email?.message}
                {...register('email', { required: 'Email is required' })}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Bio
                </label>
                <textarea
                  rows={4}
                  maxLength={300}
                  className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors resize-none"
                  placeholder="Tell students about yourself..."
                  {...register('bio')}
                />
                <div className="text-xs text-slate-500 dark:text-slate-500 text-right">
                  {bio?.length || 0} / 300
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Expertise Areas
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, Machine Learning (comma-separated)"
                  className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors"
                  {...register('expertiseAreas')}
                />
                {expertiseAreas && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {expertiseAreas.split(',').filter(Boolean).map((area, i) => (
                      <Badge key={i} variant="default">
                        {area.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Input
                label="LinkedIn URL"
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                error={errors.linkedinUrl?.message}
                {...register('linkedinUrl')}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Availability
                </label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                  {...register('availability', { required: 'Availability is required' })}
                >
                  <option value="accepting">Accepting Students</option>
                  <option value="not_accepting">Not Accepting</option>
                </select>
                {errors.availability && (
                  <span className="text-sm text-red-500 dark:text-red-400">
                    {errors.availability.message}
                  </span>
                )}
              </div>
              <Button type="submit" loading={saving}>
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
