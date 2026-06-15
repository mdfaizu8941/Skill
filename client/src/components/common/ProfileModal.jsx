import { useState, useEffect } from 'react'
import { ExternalLink, Link as LinkedinIcon } from 'lucide-react'
import Modal from '../ui/Modal'
import Badge from '../ui/Badge'
import Loader from './Loader'
import ErrorMessage from './ErrorMessage'
import api from '../../services/api'
import { getRoleColor } from '../../utils/roleUtils'

export default function ProfileModal({ isOpen, onClose, userId }) {
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fullScreenImage, setFullScreenImage] = useState(false)

  useEffect(() => {
    if (!isOpen || !userId) return
    
    let active = true
    const fetchProfile = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.get(`/profile/${userId}`)
        if (active) setProfileData(data)
      } catch (err) {
        if (active) setError(err?.response?.data?.message || 'Failed to load profile')
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchProfile()

    return () => { active = false }
  }, [isOpen, userId])

  const user = profileData?.user
  const profile = profileData?.profile

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title="User Profile">
      <div className="space-y-6">
        {loading ? (
          <div className="py-8 flex justify-center"><Loader /></div>
        ) : error ? (
          <ErrorMessage message={error} />
        ) : user ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <button 
                type="button"
                onClick={() => { if (user?.avatarUrl || user?.profilePic) setFullScreenImage(true) }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-transform hover:scale-105"
                title={user?.avatarUrl || user?.profilePic ? "Click to view full image" : ""}
              >
                {user.avatarUrl || user.profilePic ? (
                  <img src={user.avatarUrl || user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  getInitials(user.name)
                )}
              </button>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1 truncate">{user.name}</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="default" className={getRoleColor(user.role)}>
                    {user.role}
                  </Badge>
                  {profile?.university && (
                    <Badge variant="default">
                      {profile.university}
                    </Badge>
                  )}
                </div>
                {user.linkedinUrl && (
                  <a
                    href={user.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    <LinkedinIcon className="w-4 h-4" />
                    LinkedIn Profile
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {user.bio && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-2">About</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">{user.bio}</p>
              </div>
            )}

            {user.expertiseAreas && user.expertiseAreas.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-2">Expertise Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {user.expertiseAreas.map((area, i) => (
                    <Badge key={i} variant="brand">{area}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {user.availability && user.role === 'Mentor' && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-2">Status</h4>
                <Badge variant={user.availability === 'accepting' ? 'success' : 'warning'}>
                  {user.availability === 'accepting' ? 'Accepting Students' : 'Not Accepting'}
                </Badge>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </Modal>

    {fullScreenImage && (user?.avatarUrl || user?.profilePic) && (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 cursor-zoom-out animate-in fade-in duration-200"
        onClick={() => setFullScreenImage(false)}
      >
        <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center">
          <img 
            src={user.avatarUrl || user.profilePic} 
            alt={user.name} 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setFullScreenImage(false); }}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      </div>
    )}
    </>
  )
}
