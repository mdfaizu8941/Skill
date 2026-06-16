import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { Save, Camera, Upload, Trash2, Plus, User, Calendar, Link as LinkedinIcon, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import Card, { CardHeader } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Loader from '../../components/common/Loader'
import ErrorMessage from '../../components/common/ErrorMessage'
import { useAuth } from '../../context/AuthContext'
import { getMyProfile, updateMyProfile, uploadAvatar, deleteAvatar } from '../../services/profileService'
import { getMySkills, createSkill, deleteSkill } from '../../services/skillService'
import api from '../../services/api'

export default function MyProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [skills, setSkills] = useState([])
  const [mentor, setMentor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  
  // Avatar upload state
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [deletingAvatar, setDeletingAvatar] = useState(false)
  
  // Skill modal state
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false)
  const [addingSkill, setAddingSkill] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm()

  const {
    register: registerSkill,
    handleSubmit: handleSubmitSkill,
    formState: { errors: skillErrors },
    reset: resetSkill,
  } = useForm()

  const bio = watch('bio', '')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [profileRes, skillsRes] = await Promise.all([
        getMyProfile(),
        getMySkills(),
      ])
      setProfile({
        ...profileRes.data.profile,
        avatar: profileRes.data.user?.avatarUrl || profileRes.data.user?.profilePic
      })
      setSkills(skillsRes.data.skills || [])
      
      // Fetch mentor if assigned
      const mentorId = profileRes.data.profile?.mentorId?._id || profileRes.data.profile?.mentorId
      if (mentorId) {
      try {
        const mentorRes = await api.get(`/profile/${mentorId}`)
        setMentor(mentorRes.data.user)
      } catch (err) {
        console.error('Failed to fetch mentor:', err)
      }
      }
      
      reset({
        fullName: profileRes.data.profile?.fullName || profileRes.data.user?.name || '',
        bio: profileRes.data.user?.bio || '',
        university: profileRes.data.profile?.university || '',
        enrollmentYear: profileRes.data.profile?.enrollmentYear || '',
        graduationYear: profileRes.data.profile?.graduationYear || '',
        branch: profileRes.data.profile?.branch || '',
        year: profileRes.data.profile?.year || '',
        cgpa: profileRes.data.profile?.cgpa || '',
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
    await updateMyProfile({
      name: data.fullName,
      bio: data.bio,
      university: data.university,
      enrollmentYear: data.enrollmentYear,
      graduationYear: data.graduationYear,
      branch: data.branch,
      year: data.year,
      cgpa: data.cgpa,
    })
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
      setProfile({ ...profile, avatar: res.data.avatarUrl })
      setAvatarFile(null)
      setAvatarPreview(null)
      toast.success('Avatar updated successfully!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleDeleteAvatar = async () => {
    if (!window.confirm('Are you sure you want to delete your avatar?')) return
    
    setDeletingAvatar(true)
    try {
      await deleteAvatar()
      setProfile({ ...profile, avatar: '' })
      setAvatarFile(null)
      setAvatarPreview(null)
      toast.success('Avatar deleted successfully!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed')
    } finally {
      setDeletingAvatar(false)
    }
  }

  const handleAddSkill = async (data) => {
    setAddingSkill(true)
    try {
      const res = await createSkill({
        skillName: data.skillName,
        category: data.category,
        level: data.level,
      })
      setSkills([...skills, res.data.skill])
      toast.success('Skill added successfully!')
      setIsSkillModalOpen(false)
      resetSkill()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add skill')
    } finally {
      setAddingSkill(false)
    }
  }

  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm('Are you sure you want to delete this skill?')) return

    try {
      await deleteSkill(skillId)
      setSkills(skills.filter((s) => s._id !== skillId))
      toast.success('Skill deleted successfully!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete skill')
    }
  }

  const getLevelBadgeVariant = (level) => {
    if (level === 'Beginner') return 'info'
    if (level === 'Intermediate') return 'warning'
    if (level === 'Expert') return 'success'
    return 'default'
  }

  const getInitials = (name) => {
    if (!name) return 'U'
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
          {/* Section 1 - Profile Header */}
          <Card>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative group">
                <div className="w-30 h-30 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                  {avatarPreview || profile?.avatar ? (
                    <img
                      src={avatarPreview || profile.avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-slate-600 dark:text-slate-400">
                      {getInitials(profile?.fullName)}
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
              {profile?.avatar && !avatarFile && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleDeleteAvatar}
                  loading={deletingAvatar}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Avatar
                </Button>
              )}
            </div>
          </Card>

          {/* Section 4 - Account Info */}
          <Card>
            <CardHeader title="Account Information" />
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Role</span>
                <Badge variant="brand">{user?.role || 'Student'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Status</span>
                <Badge variant="success">Active</Badge>
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

        {/* Right Column - Personal Info & Skills */}
        <div className="md:col-span-2 space-y-6">
          {/* Section 2 - Personal Information */}
          <Card>
            <CardHeader title="Personal Information" subtitle="Update your account details" />
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
              <Input
                label="Full Name"
                error={errors.fullName?.message}
                {...register('fullName', { required: 'Full name is required' })}
              />
              <div className="space-y-1">
  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
    Email
  </label>
  <input
    type="email"
    value={user?.email || ''}
    disabled
    readOnly
    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed text-sm"
  />
  <p className="text-xs text-slate-400">Email cannot be changed</p>
</div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Bio
                </label>
                <textarea
                  rows={4}
                  maxLength={300}
                  className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors resize-none"
                  placeholder="Tell us about yourself..."
                  {...register('bio')}
                />
                <div className="text-xs text-slate-500 dark:text-slate-500 text-right">
                  {bio?.length || 0} / 300
                </div>
              </div>
              <Input
                label="University"
                error={errors.university?.message}
                {...register('university', { required: 'University is required' })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Enrollment Year"
                  type="number"
                  error={errors.enrollmentYear?.message}
                  {...register('enrollmentYear', {
                    required: 'Enrollment year is required',
                    pattern: {
                      value: /^\d{4}$/,
                      message: 'Must be a 4-digit year',
                    },
                  })}
                />
                <Input
                  label="Graduation Year"
                  type="number"
                  error={errors.graduationYear?.message}
                  {...register('graduationYear', {
                    required: 'Graduation year is required',
                    pattern: {
                      value: /^\d{4}$/,
                      message: 'Must be a 4-digit year',
                    },
                  })}
                />
              </div>
              <Input
                label="Branch/Department"
                placeholder="e.g. Computer Science"
                error={errors.branch?.message}
                {...register('branch')}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Current Year"
                  type="number"
                  placeholder="1-6"
                  error={errors.year?.message}
                  {...register('year', {
                    min: { value: 1, message: 'Min year is 1' },
                    max: { value: 6, message: 'Max year is 6' }
                  })}
                />
                <Input
                  label="CGPA"
                  type="number"
                  step="0.01"
                  placeholder="0.00-10.00"
                  error={errors.cgpa?.message}
                  {...register('cgpa', {
                    min: { value: 0, message: 'Min CGPA is 0' },
                    max: { value: 10, message: 'Max CGPA is 10' }
                  })}
                />
              </div>
              <Button type="submit" loading={saving}>
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </form>
          </Card>

          {/* Section 3 - My Skills */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardHeader title="My Skills" subtitle="Manage your skill portfolio" />
              <Button size="sm" onClick={() => setIsSkillModalOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Skill
              </Button>
            </div>

            {skills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <User className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                  No skills added yet. Add your first skill or parse your resume.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {skills.map((skill) => (
                  <div
                    key={skill._id}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-start justify-between"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 dark:text-slate-200 mb-2">
                        {skill.skillName}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">{skill.category}</Badge>
                        <Badge variant={getLevelBadgeVariant(skill.level)}>{skill.level}</Badge>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSkill(skill._id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* My Mentor Section */}
      <Card>
        <CardHeader title="My Mentor" subtitle="Your assigned mentor information" />
        {!mentor ? (
          <div className="flex flex-col items-center justify-center py-12 text-center mt-4">
            <User className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">
              No mentor assigned yet
            </p>
            <p className="text-slate-500 dark:text-slate-500 text-xs">
              Contact your placement officer to get assigned a mentor
            </p>
          </div>
        ) : (
          <div className="mt-4 p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {mentor.name?.charAt(0)?.toUpperCase() || 'M'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200 mb-1">
                  {mentor.name || 'Unknown'}
                </h3>
                {mentor.bio && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    {mentor.bio}
                  </p>
                )}
                {mentor.expertiseAreas && mentor.expertiseAreas.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Expertise Areas:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {mentor.expertiseAreas.map((area, i) => (
                        <Badge key={i} variant="brand">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  {mentor.linkedinUrl && (
                    <a
                      href={mentor.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      <LinkedinIcon className="w-4 h-4" />
                      LinkedIn Profile
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {mentor.availability && (
                    <Badge variant={mentor.availability === 'accepting' ? 'success' : 'warning'}>
                      {mentor.availability === 'accepting' ? 'Accepting Students' : 'Not Accepting'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Add Skill Modal */}
      <Modal
        isOpen={isSkillModalOpen}
        onClose={() => {
          setIsSkillModalOpen(false)
          resetSkill()
        }}
        title="Add Skill"
      >
        <form onSubmit={handleSubmitSkill(handleAddSkill)} className="space-y-4">
          <Input
            label="Skill Name"
            error={skillErrors.skillName?.message}
            {...registerSkill('skillName', { required: 'Skill name is required' })}
          />
          <Input
            label="Category"
            error={skillErrors.category?.message}
            {...registerSkill('category', { required: 'Category is required' })}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Level</label>
            <select
              className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
              {...registerSkill('level', { required: 'Level is required' })}
            >
              <option value="">Select level</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Expert">Expert</option>
            </select>
            {skillErrors.level && (
              <span className="text-sm text-red-500 dark:text-red-400">
                {skillErrors.level.message}
              </span>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsSkillModalOpen(false)
                resetSkill()
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" loading={addingSkill} className="flex-1">
              Add Skill
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  )
}
