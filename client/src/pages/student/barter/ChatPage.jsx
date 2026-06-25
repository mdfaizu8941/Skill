import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageCircle, Send, Search, Trash2 } from 'lucide-react'
import { io } from 'socket.io-client'
import api, { extractMessage } from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import Card, { CardHeader } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import ProfileModal from '../../../components/common/ProfileModal'

const toId = (v) => { if (!v) return ''; if (v._id) return v._id; if (v.id) return v.id; return v }
const fmtTime = (v) => { if (!v) return ''; const d = new Date(v); const t = new Date(); return d.toDateString() === t.toDateString() ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) }

export default function ChatPage() {
  const { user, token } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const currentUserId = user?._id || user?.id
  const [conversations, setConversations] = useState([])
  const [peerId, setPeerId] = useState('')
  const [message, setMessage] = useState({ text: '', attachmentUrl: '' })
  const [messages, setMessages] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [error, setError] = useState('')
  const [navHandled, setNavHandled] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [openDeleteMenuId, setOpenDeleteMenuId] = useState(null)
  
  const socketRef = useRef(null)

  useEffect(() => {
    const handleBodyClick = () => setOpenDeleteMenuId(null);
    if (openDeleteMenuId) {
      document.addEventListener('click', handleBodyClick);
    }
    return () => document.removeEventListener('click', handleBodyClick);
  }, [openDeleteMenuId]);

  const activeConv = useMemo(() => conversations.find((c) => toId(c.peer) === peerId), [conversations, peerId])

  const loadConversations = useCallback(async () => { const { data } = await api.get('/messages/conversations'); setConversations(data.conversations || []) }, [])
  const markRead = useCallback(async (id) => { if (id) await api.patch(`/messages/conversations/${id}/read`) }, [])
  const loadMessages = useCallback(async (id) => { if (!id) { setMessages([]); return }; const { data } = await api.get('/messages', { params: { otherUserId: id } }); setMessages(data.messages || []) }, [])

  // Socket.io is not implemented on the backend yet.
  // The page already uses HTTP polling every 10 seconds below, so chat will still work!

  const openConversation = async (conv) => {
    const nid = toId(conv.peer); if (!nid) return
    setError(''); setPeerId(nid); setSearchOpen(false)
    try { await markRead(nid); await Promise.all([loadMessages(nid), loadConversations()]) }
    catch (err) { setError(extractMessage(err)) }
  }

  const startChat = async (selectedUser) => {
    const sid = toId(selectedUser); if (!sid) return; setError('')
    try { const { data } = await api.post('/messages/conversations', { peerId: sid }); await loadConversations(); await openConversation(data.conversation); setSearch(''); setSearchResults([]) }
    catch (err) { setError(extractMessage(err)) }
  }

  useEffect(() => {
    if (navHandled || !location.state?.peerId) return
    const open = async () => { setNavHandled(true); try { const { data } = await api.post('/messages/conversations', { peerId: location.state.peerId }); await openConversation(data.conversation); navigate('.', { replace: true, state: null }) } catch (err) { setError(extractMessage(err)) } }
    open()
  }, [location.state, navHandled, navigate])

  useEffect(() => { let a = true; const l = async () => { try { const { data } = await api.get('/messages/conversations'); if (a) setConversations(data.conversations || []) } catch (err) { if (a) setError(extractMessage(err)) } }; l(); const i = setInterval(l, 10000); return () => { a = false; clearInterval(i) } }, [])

  useEffect(() => { if (!peerId) return; let a = true; const r = async () => { try { await markRead(peerId); const [m, c] = await Promise.all([api.get('/messages', { params: { otherUserId: peerId } }), api.get('/messages/conversations')]); if (a) { setMessages(m.data.messages || []); setConversations(c.data.conversations || []) } } catch (err) { if (a) setError(extractMessage(err)) } }; r(); const i = setInterval(r, 10000); return () => { a = false; clearInterval(i) } }, [peerId, markRead])

  useEffect(() => { if (!searchOpen || search.trim().length < 2) { setSearchResults([]); return } let a = true; const t = setTimeout(async () => { try { const { data } = await api.get('/messages/users/search', { params: { q: search } }); if (a) setSearchResults(data.users || []) } catch (err) { if (a) setError(extractMessage(err)) } }, 250); return () => { a = false; clearTimeout(t) } }, [search, searchOpen])

  const send = async (e) => {
    e.preventDefault(); setError('')
    if (!peerId) { setError('Select a conversation first.'); return }
    try { 
      const { data } = await api.post('/messages', { receiver: peerId, text: message.text, attachmentUrl: message.attachmentUrl }); 
      setMessage({ text: '', attachmentUrl: '' });
      setMessages(prev => [...prev, data.message]);
      await loadConversations();
    } catch (err) { setError(extractMessage(err)) }
  }

  const deleteConversation = async (e, convId, convPeerId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this entire conversation?')) return;
    try {
      await api.delete(`/messages/conversations/${convPeerId}`);
      if (peerId === convPeerId) {
        setPeerId('');
        setMessages([]);
      }
      await loadConversations();
    } catch (err) {
      setError(extractMessage(err));
    }
  }

  const deleteMsg = async (msgId, type) => {
    if (!window.confirm(`Delete this message ${type === 'for_everyone' ? 'for everyone' : 'for me'}?`)) return;
    try {
      await api.delete(`/messages/${msgId}`, { data: { type } });
      setMessages(prev => 
        prev.filter(m => !(type === 'for_me' && m._id === msgId))
            .map(m => m._id === msgId && type === 'for_everyone' ? { ...m, text: 'This message was deleted', attachmentUrl: '', isDeletedForEveryone: true } : m)
      );
      await loadConversations();
    } catch (err) {
      setError(extractMessage(err));
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chat</h1><Button onClick={() => setSearchOpen((v) => !v)} variant={searchOpen ? 'secondary' : 'primary'}><Search className="w-4 h-4 mr-2" /> New Chat</Button></div>
      {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">{error}</div>}

      {searchOpen && (
        <Card>
          <CardHeader title="Start a new chat" subtitle="Search users by name, email, or skills." />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search people, emails, or skills" autoFocus className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-colors mb-3" />
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map((r) => (
              <div key={r._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                  <img src={r.avatarUrl || r.profilePic || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(r.name || 'User')}`} alt="" className="w-9 h-9 rounded-full" />
                  <div><p className="text-sm font-medium text-slate-900 dark:text-slate-200">{r.name || 'User'}</p><p className="text-xs text-slate-500">{r.email}</p></div>
                </div>
                <Button size="sm" onClick={() => startChat(r)}>Chat</Button>
              </div>
            ))}
            {search.trim().length >= 2 && !searchResults.length && <p className="text-sm text-slate-500 text-center py-4">No users found.</p>}
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-[320px_1fr] gap-4 min-h-[500px]">
        <Card className="overflow-y-auto max-h-[600px] p-0" noPadding>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800"><h2 className="font-semibold text-slate-900 dark:text-slate-200">Conversations</h2></div>
          {conversations.map((conv) => { const peer = conv.peer || {}; const id = toId(peer); const active = peerId === id; const unread = conv.unreadCount > 0; return (
            <div key={id} className={`w-full flex items-stretch border-b border-slate-50 dark:border-slate-800/50 transition-colors group ${active ? 'bg-brand-50 dark:bg-brand-600/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
              <button type="button" onClick={() => openConversation(conv)} className="flex-1 text-left px-4 py-3 min-w-0">
                <div className="flex items-center justify-between"><span className="flex items-center gap-2">{unread && <span className="w-2 h-2 rounded-full bg-brand-500 dark:bg-brand-400" />}<span className="font-medium text-sm text-slate-900 dark:text-slate-200 truncate">{peer.name || 'Peer'}</span></span><span className="text-[11px] text-slate-500 flex-shrink-0 ml-2">{fmtTime(conv.lastMessageAt)}</span></div>
                <div className="flex items-center justify-between mt-1"><span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{conv.lastMessage || 'No messages yet'}</span>{unread && <Badge variant="brand">{conv.unreadCount}</Badge>}</div>
              </button>
              <button 
                type="button" 
                onClick={(e) => deleteConversation(e, conv._id, id)} 
                title="Delete conversation"
                className="px-3 flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) })}
          {!conversations.length && <p className="text-sm text-slate-500 text-center py-8">No conversations yet.</p>}
        </Card>

        <Card className="flex flex-col p-0 h-[600px]" noPadding>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            {activeConv?.peer ? (
              <button 
                onClick={() => setProfileModalOpen(true)}
                className="flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 p-2 -m-2 rounded-lg transition-colors text-left max-w-full"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
                  {activeConv.peer.avatarUrl || activeConv.peer.profilePic ? (
                    <img src={activeConv.peer.avatarUrl || activeConv.peer.profilePic} alt={activeConv.peer.name} className="w-full h-full object-cover" />
                  ) : (
                    activeConv.peer.name?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-slate-900 dark:text-slate-200 truncate">{activeConv.peer.name}</h2>
                  <p className="text-xs text-slate-500">Click to view profile</p>
                </div>
              </button>
            ) : (
              <h2 className="font-semibold text-slate-900 dark:text-slate-200">Select a conversation</h2>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length > 0 ? messages.map((m) => { const mine = m.sender?._id === currentUserId || m.sender?.id === currentUserId; return (
              <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'} group relative`}>
                <div className={`max-w-[75%] rounded-xl px-4 py-2.5 relative ${mine ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200'} ${m.isDeletedForEveryone ? 'opacity-60 italic' : ''}`}>
                  <p className="text-sm whitespace-pre-wrap">{m.text || 'Attachment shared'}</p>
                  {m.attachmentUrl && !m.isDeletedForEveryone && <a href={m.attachmentUrl} target="_blank" rel="noreferrer" className="text-xs underline opacity-75 mt-1 block">Open attachment</a>}
                  <div className="flex items-center gap-2 mt-1"><span className="text-[10px] opacity-60">{fmtTime(m.createdAt)}</span>{mine && <span className="text-[10px] opacity-60">{m.isRead || m.readAt ? 'Read' : 'Sent'}</span>}</div>
                  
                  {/* Delete Options Button (shown on hover) */}
                  <div className={`absolute top-1/2 -translate-y-1/2 ${mine ? '-left-10' : '-right-10'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center`}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setOpenDeleteMenuId(openDeleteMenuId === m._id ? null : m._id); }} 
                      className="p-1.5 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-red-100 hover:text-red-600 transition-colors text-slate-500 dark:text-slate-400"
                      title="Delete message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    {/* Delete Menu Popup */}
                    {openDeleteMenuId === m._id && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute z-10 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 flex flex-col -top-2 ${mine ? 'right-full mr-2' : 'left-full ml-2'}`}
                      >
                        <button onClick={() => { setOpenDeleteMenuId(null); deleteMsg(m._id, 'for_me'); }} className="text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          Delete for me
                        </button>
                        {mine && !m.isDeletedForEveryone && (
                          <button onClick={() => { setOpenDeleteMenuId(null); deleteMsg(m._id, 'for_everyone'); }} className="text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                            Delete for everyone
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) }) : <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm"><MessageCircle className="w-10 h-10 mb-2 opacity-40" /> Select a conversation to start chatting.</div>}
          </div>
          <form onSubmit={send} className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2 shrink-0">
            <input value={message.attachmentUrl} onChange={(e) => setMessage({ ...message, attachmentUrl: e.target.value })} placeholder="Attachment URL (optional)" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-colors" />
            <div className="flex gap-2">
              <textarea rows={2} value={message.text} onChange={(e) => setMessage({ ...message, text: e.target.value })} placeholder={peerId ? 'Type a message...' : 'Select a conversation'} disabled={!peerId} className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-colors resize-none disabled:opacity-50" />
              <Button type="submit" disabled={!peerId} className="self-end"><Send className="w-4 h-4" /></Button>
            </div>
          </form>
        </Card>
      </div>

      <ProfileModal 
        isOpen={profileModalOpen} 
        onClose={() => setProfileModalOpen(false)} 
        userId={activeConv?.peer?._id || activeConv?.peer?.id} 
      />
    </motion.div>
  )
}
