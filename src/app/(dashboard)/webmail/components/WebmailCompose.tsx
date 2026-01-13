// src/app/(dashboard)/webmail/components/WebmailCompose.tsx
'use client'

import { useState, useRef } from 'react'
import { X, Send, Paperclip, Minimize2, Save, ChevronDown, ChevronUp, Quote } from 'lucide-react'
import { showError, showSuccess } from '@/lib/swal'

interface Props {
  replyTo?: {
    messageId: string
    subject: string
    from: { name: string; address: string }[]
    to: { name: string; address: string }[]
    html?: string
    text?: string
    date: string
  } | null
  currentEmail: string
  onClose: () => void
  onSent: () => void
}

export default function WebmailCompose({ replyTo, currentEmail, onClose, onSent }: Props) {
  const [to, setTo] = useState(replyTo ? replyTo.from[0]?.address || '' : '')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [subject, setSubject] = useState(
    replyTo ? `Re: ${replyTo.subject.replace(/^Re:\s*/i, '')}` : ''
  )
  // ข้อความใหม่ที่ผู้ใช้พิมพ์ - ไม่รวม quoted message
  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [showQuoted, setShowQuoted] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Format quoted message สำหรับส่งจริง
  const getFullBody = () => {
    if (!replyTo) return body

    const quotedHeader = `\n\n-------- ข้อความต้นฉบับ --------\nจาก: ${replyTo.from[0]?.name || ''} <${replyTo.from[0]?.address || ''}>\nวันที่: ${new Date(replyTo.date).toLocaleString('th-TH')}\nหัวข้อ: ${replyTo.subject}\n\n`
    const quotedBody = replyTo.text || ''
    
    return body + quotedHeader + quotedBody
  }

  const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setAttachments(prev => [...prev, ...newFiles])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleSaveDraft = async () => {
    setSavingDraft(true)

    try {
      const formData = new FormData()
      formData.append('to', to)
      if (cc) formData.append('cc', cc)
      if (bcc) formData.append('bcc', bcc)
      formData.append('subject', subject || '(ไม่มีหัวข้อ)')
      formData.append('text', getFullBody())

      for (const file of attachments) {
        formData.append('attachments', file)
      }

      const res = await fetch('/api/webmail/drafts', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (data.success) {
        showSuccess('บันทึกฉบับร่างสำเร็จ')
      } else {
        showError(data.message || 'บันทึกฉบับร่างไม่สำเร็จ')
      }
    } catch (error) {
      showError('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setSavingDraft(false)
    }
  }

  const handleSend = async () => {
    if (!to.trim()) {
      showError('กรุณาระบุผู้รับ')
      return
    }

    if (!subject.trim()) {
      showError('กรุณาระบุหัวข้อ')
      return
    }

    setSending(true)

    try {
      const formData = new FormData()
      formData.append('to', to)
      if (cc) formData.append('cc', cc)
      if (bcc) formData.append('bcc', bcc)
      formData.append('subject', subject)
      formData.append('text', getFullBody())
      
      if (replyTo) {
        formData.append('inReplyTo', replyTo.messageId)
        formData.append('references', replyTo.messageId)
      }

      for (const file of attachments) {
        formData.append('attachments', file)
      }

      const res = await fetch('/api/webmail/send', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (data.success) {
        showSuccess('ส่งอีเมล์สำเร็จ')
        onSent()
      } else {
        showError(data.message || 'ส่งอีเมล์ไม่สำเร็จ')
      }
    } catch (error) {
      showError('เกิดข้อผิดพลาดในการส่ง')
    } finally {
      setSending(false)
    }
  }

  if (minimized) {
    return (
      <div 
        className="fixed bottom-4 right-4 bg-slate-800 border border-slate-700 rounded-t-xl shadow-2xl cursor-pointer"
        onClick={() => setMinimized(false)}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <Send className="w-5 h-5 text-primary-400" />
          <span className="text-white font-medium">
            {subject || 'อีเมล์ใหม่'}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="ml-4 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">
            {replyTo ? 'ตอบกลับ' : 'เขียนอีเมล์ใหม่'}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMinimized(true)}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* From */}
          <div className="flex items-center gap-4">
            <label className="w-16 text-sm text-slate-400">จาก:</label>
            <input
              type="text"
              value={currentEmail}
              disabled
              className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-400"
            />
          </div>

          {/* To */}
          <div className="flex items-center gap-4">
            <label className="w-16 text-sm text-slate-400">ถึง:</label>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="email@example.com"
                className="flex-1 input-field py-2"
                disabled={sending}
              />
              {!showCc && (
                <button
                  onClick={() => setShowCc(true)}
                  className="text-sm text-primary-400 hover:text-primary-300"
                >
                  Cc
                </button>
              )}
              {!showBcc && (
                <button
                  onClick={() => setShowBcc(true)}
                  className="text-sm text-primary-400 hover:text-primary-300"
                >
                  Bcc
                </button>
              )}
            </div>
          </div>

          {/* Cc */}
          {showCc && (
            <div className="flex items-center gap-4">
              <label className="w-16 text-sm text-slate-400">Cc:</label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="email@example.com"
                className="flex-1 input-field py-2"
                disabled={sending}
              />
            </div>
          )}

          {/* Bcc */}
          {showBcc && (
            <div className="flex items-center gap-4">
              <label className="w-16 text-sm text-slate-400">Bcc:</label>
              <input
                type="text"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="email@example.com"
                className="flex-1 input-field py-2"
                disabled={sending}
              />
            </div>
          )}

          {/* Subject */}
          <div className="flex items-center gap-4">
            <label className="w-16 text-sm text-slate-400">หัวข้อ:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="หัวข้ออีเมล์"
              className="flex-1 input-field py-2"
              disabled={sending}
            />
          </div>

          {/* Body - ช่องพิมพ์ข้อความใหม่ */}
          <div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="พิมพ์ข้อความตอบกลับของคุณที่นี่..."
              className="w-full h-40 input-field resize-none"
              disabled={sending}
              autoFocus
            />
          </div>

          {/* Quoted Message Box - แยกออกมาต่างหาก */}
          {replyTo && (
            <div className="rounded-xl border border-slate-600 overflow-hidden">
              {/* Header ของ quoted message */}
              <button
                onClick={() => setShowQuoted(!showQuoted)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-700/50 hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2 text-slate-400">
                  <Quote className="w-4 h-4" />
                  <span className="text-sm font-medium">ข้อความต้นฉบับ</span>
                </div>
                {showQuoted ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {/* เนื้อหา quoted message */}
              {showQuoted && (
                <div className="bg-slate-900/50 p-4 border-t border-slate-600">
                  {/* ข้อมูล header ของอีเมล์ต้นฉบับ */}
                  <div className="mb-3 pb-3 border-b border-slate-700 space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-slate-500 w-12 flex-shrink-0">จาก:</span>
                      <span className="text-sm text-slate-300">
                        {replyTo.from[0]?.name && (
                          <span className="font-medium">{replyTo.from[0].name} </span>
                        )}
                        <span className="text-slate-400">&lt;{replyTo.from[0]?.address}&gt;</span>
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-slate-500 w-12 flex-shrink-0">วันที่:</span>
                      <span className="text-sm text-slate-400">
                        {new Date(replyTo.date).toLocaleString('th-TH', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-slate-500 w-12 flex-shrink-0">หัวข้อ:</span>
                      <span className="text-sm text-slate-300">{replyTo.subject}</span>
                    </div>
                  </div>

                  {/* เนื้อหาข้อความต้นฉบับ */}
                  <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {replyTo.text || (
                      <span className="text-slate-500 italic">ไม่มีเนื้อหาข้อความ</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-slate-400">ไฟล์แนบ:</p>
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg"
                  >
                    <Paperclip className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-white">{file.name}</span>
                    <span className="text-xs text-slate-500">
                      ({formatFileSize(file.size)})
                    </span>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleAttachmentSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || savingDraft}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
              title="แนบไฟล์"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={sending || savingDraft}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
              title="บันทึกฉบับร่าง"
            >
              {savingDraft ? (
                <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span className="text-sm">บันทึกร่าง</span>
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={sending}
              className="btn-secondary"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !to.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              ส่ง
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}