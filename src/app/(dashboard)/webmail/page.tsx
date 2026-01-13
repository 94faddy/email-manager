// src/app/(dashboard)/webmail/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Mail, Inbox, Send, FileText, Trash2, Star, Archive,
  RefreshCw, Search, ChevronLeft, ChevronRight,
  Paperclip, Folder, Edit3, LogOut
} from 'lucide-react'
import { showLoading, closeLoading, showError, showSuccess, showConfirm } from '@/lib/swal'
import { useRouter } from 'next/navigation'
import WebmailCompose from './components/WebmailCompose'
import WebmailMessage from './components/WebmailMessage'

interface MailFolder {
  name: string
  path: string
  messages?: { total: number; unseen: number }
  specialUse?: string
}

interface MailMessage {
  uid: number
  messageId: string
  subject: string
  from: { name: string; address: string }[]
  to: { name: string; address: string }[]
  date: string
  flags: string[]
  isRead: boolean
  hasAttachments: boolean
}

const folderIcons: Record<string, any> = {
  'INBOX': Inbox,
  'Sent': Send,
  'Drafts': FileText,
  'Trash': Trash2,
  'Junk': Trash2,
  'Spam': Trash2,
  'Archive': Archive,
  'Starred': Star
}

export default function WebmailPage() {
  const router = useRouter()
  
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentEmail, setCurrentEmail] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)

  // Data state
  const [folders, setFolders] = useState<MailFolder[]>([])
  const [messages, setMessages] = useState<MailMessage[]>([])
  const [selectedFolder, setSelectedFolder] = useState('INBOX')
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null)
  
  // UI state
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalMessages, setTotalMessages] = useState(0)
  
  // Compose state
  const [showCompose, setShowCompose] = useState(false)
  const [replyTo, setReplyTo] = useState<any>(null)
  
  // Sidebar collapse
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Check session on mount
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const res = await fetch('/api/webmail/session')
      const data = await res.json()
      
      if (data.success && data.data) {
        setIsLoggedIn(true)
        setCurrentEmail(data.data.email)
        fetchFolders()
      }
    } catch (error) {
      console.error('Session check error:', error)
    } finally {
      setCheckingSession(false)
    }
  }

  const handleLogout = async () => {
    const result = await showConfirm('ต้องการออกจาก Webmail?', '')
    
    if (result.isConfirmed) {
      await fetch('/api/webmail/auth', { method: 'DELETE' })
      setIsLoggedIn(false)
      setCurrentEmail('')
      setFolders([])
      setMessages([])
      router.push('/emails')
    }
  }

  const fetchFolders = async () => {
    try {
      const res = await fetch('/api/webmail/folders')
      const data = await res.json()
      
      if (data.success) {
        setFolders(data.data || [])
        fetchMessages('INBOX')
      }
    } catch (error) {
      console.error('Fetch folders error:', error)
    }
  }

  const fetchMessages = async (folder: string, pageNum = 1, search = '') => {
    setLoadingMessages(true)
    setSelectedMessage(null)
    
    try {
      const params = new URLSearchParams({
        folder,
        page: pageNum.toString(),
        limit: '30'
      })
      if (search) params.set('search', search)
      
      const res = await fetch(`/api/webmail/messages?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setMessages(data.data.messages || [])
        setTotalPages(data.data.totalPages || 1)
        setTotalMessages(data.data.total || 0)
        setPage(pageNum)
      }
    } catch (error) {
      console.error('Fetch messages error:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleFolderClick = (folder: string) => {
    setSelectedFolder(folder)
    setSearchTerm('')
    fetchMessages(folder, 1)
  }

  const handleRefresh = () => {
    fetchMessages(selectedFolder, page, searchTerm)
    fetchFolders()
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchMessages(selectedFolder, 1, searchTerm)
  }

  const handleMessageClick = (uid: number) => {
    setSelectedMessage(uid)
    const msg = messages.find(m => m.uid === uid)
    if (msg && !msg.isRead) {
      fetch(`/api/webmail/messages/${uid}?folder=${encodeURIComponent(selectedFolder)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read', value: true })
      }).then(() => {
        setMessages(prev => prev.map(m => 
          m.uid === uid ? { ...m, isRead: true } : m
        ))
        setFolders(prev => prev.map(f => 
          f.path === selectedFolder && f.messages 
            ? { ...f, messages: { ...f.messages, unseen: Math.max(0, f.messages.unseen - 1) } }
            : f
        ))
      })
    }
  }

  const handleDelete = async (uid: number) => {
    const result = await showConfirm('ต้องการลบอีเมล์นี้?', '')
    
    if (result.isConfirmed) {
      try {
        const res = await fetch(
          `/api/webmail/messages/${uid}?folder=${encodeURIComponent(selectedFolder)}`,
          { method: 'DELETE' }
        )
        const data = await res.json()
        
        if (data.success) {
          showSuccess('ลบสำเร็จ')
          setSelectedMessage(null)
          fetchMessages(selectedFolder, page)
        } else {
          showError(data.message)
        }
      } catch (error) {
        showError('เกิดข้อผิดพลาด')
      }
    }
  }

  const handleReply = (message: any) => {
    setReplyTo(message)
    setShowCompose(true)
  }

  const handleComposeSent = () => {
    setShowCompose(false)
    setReplyTo(null)
    if (selectedFolder.toLowerCase().includes('sent')) {
      fetchMessages(selectedFolder, 1)
    }
  }

  const getFolderIcon = (folder: MailFolder) => {
    const name = folder.name
    for (const [key, Icon] of Object.entries(folderIcons)) {
      if (name.toLowerCase().includes(key.toLowerCase())) {
        return Icon
      }
    }
    return Folder
  }

  // Loading screen
  if (checkingSession) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 mt-4">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  // Not logged in - redirect to emails
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="card w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Webmail</h1>
          <p className="text-slate-400 mb-6">
            กรุณาเลือกอีเมล์ที่ต้องการเปิดจากหน้า "อีเมล์ของฉัน"
          </p>
          <button
            onClick={() => router.push('/emails')}
            className="btn-primary"
          >
            ไปที่อีเมล์ของฉัน
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      {/* Sidebar - Folders */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 transition-all duration-300`}>
        <div className="card h-full flex flex-col p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            {!sidebarCollapsed && (
              <div className="truncate">
                <p className="text-sm font-medium text-white truncate">{currentEmail}</p>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-400"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Compose Button */}
          <button
            onClick={() => { setReplyTo(null); setShowCompose(true); }}
            className={`btn-primary mb-4 flex items-center justify-center gap-2 ${sidebarCollapsed ? 'px-2' : ''}`}
          >
            <Edit3 className="w-5 h-5" />
            {!sidebarCollapsed && 'เขียนอีเมล์'}
          </button>

          {/* Folders List */}
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {folders.map((folder) => {
              const Icon = getFolderIcon(folder)
              const isSelected = folder.path === selectedFolder
              const unseen = folder.messages?.unseen || 0
              
              return (
                <button
                  key={folder.path}
                  onClick={() => handleFolderClick(folder.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isSelected 
                      ? 'bg-primary-600 text-white' 
                      : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{folder.name}</span>
                      {unseen > 0 && (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          isSelected ? 'bg-white/20' : 'bg-primary-500/20 text-primary-400'
                        }`}>
                          {unseen}
                        </span>
                      )}
                    </>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`mt-4 flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && 'ออกจาก Webmail'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="card mb-4 p-3">
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาอีเมล์..."
                className="input-field pl-10 py-2"
              />
            </form>
            <button
              onClick={handleRefresh}
              disabled={loadingMessages}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300"
            >
              <RefreshCw className={`w-5 h-5 ${loadingMessages ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Message List */}
          <div className={`${selectedMessage ? 'w-2/5' : 'w-full'} flex flex-col min-w-0 transition-all`}>
            <div className="card flex-1 flex flex-col p-0 overflow-hidden">
              {/* List Header */}
              <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  {totalMessages} อีเมล์
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchMessages(selectedFolder, page - 1, searchTerm)}
                    disabled={page <= 1 || loadingMessages}
                    className="p-1 rounded hover:bg-slate-700 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-400" />
                  </button>
                  <span className="text-sm text-slate-400">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => fetchMessages(selectedFolder, page + 1, searchTerm)}
                    disabled={page >= totalPages || loadingMessages}
                    className="p-1 rounded hover:bg-slate-700 disabled:opacity-50"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Message Items */}
              <div className="flex-1 overflow-y-auto">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                    <Inbox className="w-12 h-12 mb-2 opacity-50" />
                    <p>ไม่มีอีเมล์</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.uid}
                      onClick={() => handleMessageClick(msg.uid)}
                      className={`px-4 py-3 border-b border-slate-700/50 cursor-pointer transition-colors ${
                        selectedMessage === msg.uid 
                          ? 'bg-primary-600/20 border-l-2 border-l-primary-500' 
                          : 'hover:bg-slate-800/50'
                      } ${!msg.isRead ? 'bg-slate-800/30' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          !msg.isRead ? 'bg-primary-500/20' : 'bg-slate-700'
                        }`}>
                          <span className={`text-sm font-medium ${
                            !msg.isRead ? 'text-primary-400' : 'text-slate-400'
                          }`}>
                            {(msg.from[0]?.name || msg.from[0]?.address || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`truncate ${!msg.isRead ? 'font-semibold text-white' : 'text-slate-300'}`}>
                              {msg.from[0]?.name || msg.from[0]?.address || 'Unknown'}
                            </span>
                            <span className="text-xs text-slate-500 flex-shrink-0">
                              {new Date(msg.date).toLocaleDateString('th-TH', { 
                                day: 'numeric', 
                                month: 'short' 
                              })}
                            </span>
                          </div>
                          <p className={`truncate text-sm ${!msg.isRead ? 'text-slate-200' : 'text-slate-400'}`}>
                            {msg.subject}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {msg.hasAttachments && (
                              <Paperclip className="w-3 h-3 text-slate-500" />
                            )}
                            {msg.flags.includes('\\Flagged') && (
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Message Detail */}
          {selectedMessage && (
            <div className="w-3/5 min-w-0">
              <WebmailMessage
                uid={selectedMessage}
                folder={selectedFolder}
                onClose={() => setSelectedMessage(null)}
                onDelete={() => handleDelete(selectedMessage)}
                onReply={handleReply}
              />
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <WebmailCompose
          replyTo={replyTo}
          currentEmail={currentEmail}
          onClose={() => { setShowCompose(false); setReplyTo(null); }}
          onSent={handleComposeSent}
        />
      )}
    </div>
  )
}