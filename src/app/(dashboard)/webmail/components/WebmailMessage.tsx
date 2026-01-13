// src/app/(dashboard)/webmail/components/WebmailMessage.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  X, Reply, Forward, Trash2, Star, Archive, 
  Paperclip, Download, MoreVertical, Printer,
  ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react'
import { showError } from '@/lib/swal'

interface Attachment {
  filename: string
  contentType: string
  size: number
  contentId?: string
  hasContent: boolean
}

interface MessageDetail {
  uid: number
  messageId: string
  subject: string
  from: { name: string; address: string }[]
  to: { name: string; address: string }[]
  cc?: { name: string; address: string }[]
  date: string
  flags: string[]
  isRead: boolean
  hasAttachments: boolean
  html?: string
  text?: string
  attachments: Attachment[]
}

interface Props {
  uid: number
  folder: string
  onClose: () => void
  onDelete: () => void
  onReply: (message: MessageDetail) => void
}

export default function WebmailMessage({ uid, folder, onClose, onDelete, onReply }: Props) {
  const [message, setMessage] = useState<MessageDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const [isStarred, setIsStarred] = useState(false)

  useEffect(() => {
    fetchMessage()
  }, [uid, folder])

  const fetchMessage = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/webmail/messages/${uid}?folder=${encodeURIComponent(folder)}`)
      const data = await res.json()
      
      if (data.success) {
        setMessage(data.data)
        setIsStarred(data.data.flags.includes('\\Flagged'))
      } else {
        showError(data.message)
      }
    } catch (error) {
      showError('ไม่สามารถโหลดอีเมล์ได้')
    } finally {
      setLoading(false)
    }
  }

  const handleStar = async () => {
    if (!message) return
    
    const newStarred = !isStarred
    setIsStarred(newStarred)
    
    try {
      await fetch(`/api/webmail/messages/${uid}?folder=${encodeURIComponent(folder)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'star', value: newStarred })
      })
    } catch (error) {
      setIsStarred(!newStarred) // Revert on error
    }
  }

  const handleDownloadAttachment = (filename: string) => {
    const url = `/api/webmail/messages/${uid}/attachment?folder=${encodeURIComponent(folder)}&filename=${encodeURIComponent(filename)}`
    window.open(url, '_blank')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="card h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 mt-3">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (!message) {
    return (
      <div className="card h-full flex items-center justify-center">
        <p className="text-slate-400">ไม่พบอีเมล์</p>
      </div>
    )
  }

  return (
    <div className="card h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onReply(message)}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
            title="ตอบกลับ"
          >
            <Reply className="w-5 h-5" />
          </button>
          <button
            onClick={handleStar}
            className={`p-2 rounded-lg hover:bg-slate-700 ${
              isStarred ? 'text-amber-400' : 'text-slate-400 hover:text-white'
            }`}
            title="ติดดาว"
          >
            <Star className={`w-5 h-5 ${isStarred ? 'fill-amber-400' : ''}`} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400"
            title="ลบ"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Message Header */}
      <div className="px-4 py-4 border-b border-slate-700/50">
        <h2 className="text-xl font-semibold text-white mb-4">
          {message.subject}
        </h2>
        
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-semibold text-white">
              {(message.from[0]?.name || message.from[0]?.address || '?').charAt(0).toUpperCase()}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">
                  {message.from[0]?.name || message.from[0]?.address}
                </p>
                <p className="text-sm text-slate-400">
                  {message.from[0]?.address}
                </p>
              </div>
              <p className="text-sm text-slate-500">
                {formatDate(message.date)}
              </p>
            </div>
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 mt-2 text-sm text-slate-400 hover:text-white"
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showDetails ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}
            </button>
            
            {showDetails && (
              <div className="mt-3 p-3 bg-slate-700/30 rounded-lg text-sm space-y-2">
                <div>
                  <span className="text-slate-500">ถึง: </span>
                  <span className="text-slate-300">
                    {message.to.map(t => t.name || t.address).join(', ')}
                  </span>
                </div>
                {message.cc && message.cc.length > 0 && (
                  <div>
                    <span className="text-slate-500">Cc: </span>
                    <span className="text-slate-300">
                      {message.cc.map(c => c.name || c.address).join(', ')}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500">วันที่: </span>
                  <span className="text-slate-300">{formatDate(message.date)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attachments */}
      {message.attachments.length > 0 && (
        <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center gap-2 mb-2">
            <Paperclip className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">
              {message.attachments.length} ไฟล์แนบ
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {message.attachments.map((att, index) => (
              <button
                key={index}
                onClick={() => handleDownloadAttachment(att.filename)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4 text-primary-400" />
                <span className="text-sm text-white">{att.filename}</span>
                <span className="text-xs text-slate-500">
                  ({formatFileSize(att.size)})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {message.html ? (
          <div 
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(message.html) }}
          />
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-slate-300">
            {message.text || '(ไม่มีเนื้อหา)'}
          </pre>
        )}
      </div>

      {/* Quick Reply */}
      <div className="px-4 py-3 border-t border-slate-700">
        <button
          onClick={() => onReply(message)}
          className="w-full btn-secondary flex items-center justify-center gap-2"
        >
          <Reply className="w-5 h-5" />
          ตอบกลับ
        </button>
      </div>
    </div>
  )
}

// Simple HTML sanitizer (basic protection)
function sanitizeHtml(html: string): string {
  // Remove script tags
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove on* attributes
  clean = clean.replace(/\s+on\w+="[^"]*"/gi, '')
  clean = clean.replace(/\s+on\w+='[^']*'/gi, '')
  
  // Remove javascript: urls
  clean = clean.replace(/href="javascript:[^"]*"/gi, 'href="#"')
  clean = clean.replace(/src="javascript:[^"]*"/gi, 'src=""')
  
  return clean
}
