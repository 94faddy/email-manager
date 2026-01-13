// src/app/(dashboard)/emails/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Mail, Plus, Search, RefreshCw, Trash2, Key, X, Eye, EyeOff, Inbox, Code2, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { showLoading, closeLoading, showError, showSuccess, showConfirm } from '@/lib/swal'

interface EmailItem {
  id: number
  email: string
  domain: string
  mailName: string
  isActive: boolean
  hasPassword: boolean
  createdAt: string
}

export default function EmailsPage() {
  const router = useRouter()
  const [emails, setEmails] = useState<EmailItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Password Modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedEmailId, setSelectedEmailId] = useState<number>(0)
  const [selectedEmailAddress, setSelectedEmailAddress] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [openWebmailAfter, setOpenWebmailAfter] = useState(false)

  // SMTP Settings Modal state
  const [showSmtpModal, setShowSmtpModal] = useState(false)
  const [smtpEmail, setSmtpEmail] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const fetchEmails = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/emails')
      const data = await res.json()
      
      if (data.success) {
        setEmails(data.data || [])
      } else {
        showError(data.message || 'ไม่สามารถดึงข้อมูลได้')
      }
    } catch {
      showError('ไม่สามารถเชื่อมต่อได้')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmails()
  }, [])

  const handleRefresh = async () => {
    showLoading('กำลังโหลดข้อมูล...')
    await fetchEmails()
    closeLoading()
  }

  const handleDelete = async (email: string) => {
    const result = await showConfirm(
      `ต้องการลบ ${email} หรือไม่?`,
      'การดำเนินการนี้ไม่สามารถย้อนกลับได้'
    )

    if (result.isConfirmed) {
      showLoading('กำลังลบอีเมล์...')
      try {
        const res = await fetch(`/api/emails?email=${encodeURIComponent(email)}`, {
          method: 'DELETE'
        })
        const data = await res.json()
        closeLoading()

        if (data.success) {
          showSuccess('ลบอีเมล์สำเร็จ')
          fetchEmails()
        } else {
          showError(data.message || 'ไม่สามารถลบอีเมล์ได้')
        }
      } catch {
        closeLoading()
        showError('เกิดข้อผิดพลาด')
      }
    }
  }

  // Password Modal Functions
  const openPasswordModal = (id: number, email: string, forWebmail = false) => {
    setSelectedEmailId(id)
    setSelectedEmailAddress(email)
    setNewPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setOpenWebmailAfter(forWebmail)
    setShowPasswordModal(true)
  }

  const closePasswordModal = () => {
    setShowPasswordModal(false)
    setSelectedEmailId(0)
    setSelectedEmailAddress('')
    setNewPassword('')
    setConfirmPassword('')
    setOpenWebmailAfter(false)
  }

  const handleChangePassword = async () => {
    if (!newPassword) {
      showError('กรุณากรอกรหัสผ่านใหม่')
      return
    }

    if (newPassword.length < 8) {
      showError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      return
    }

    if (newPassword !== confirmPassword) {
      showError('รหัสผ่านไม่ตรงกัน')
      return
    }

    setChangingPassword(true)
    try {
      const res = await fetch(`/api/emails/${selectedEmailId}/update-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      })
      const data = await res.json()

      if (data.success) {
        showSuccess('เปลี่ยนรหัสผ่านสำเร็จ')
        const shouldOpenWebmail = openWebmailAfter
        const emailId = selectedEmailId
        closePasswordModal()
        fetchEmails()
        
        if (shouldOpenWebmail) {
          setTimeout(() => handleOpenWebmail(emailId), 500)
        }
      } else {
        showError(data.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้')
      }
    } catch {
      showError('เกิดข้อผิดพลาด')
    } finally {
      setChangingPassword(false)
    }
  }

  // Webmail Functions
  const handleOpenWebmail = async (emailId: number) => {
    showLoading('กำลังเข้าสู่ระบบ Webmail...')
    
    try {
      const res = await fetch('/api/webmail/auto-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId })
      })
      const data = await res.json()
      closeLoading()

      if (data.success) {
        router.push('/webmail')
      } else if (data.needPassword) {
        const email = emails.find(e => e.id === emailId)
        if (email) {
          openPasswordModal(emailId, email.email, true)
        }
      } else {
        showError(data.message || 'ไม่สามารถเข้าสู่ระบบได้')
      }
    } catch {
      closeLoading()
      showError('เกิดข้อผิดพลาด')
    }
  }

  // SMTP Modal Functions
  const openSmtpModal = (email: string) => {
    setSmtpEmail(email)
    setShowSmtpModal(true)
  }

  const closeSmtpModal = () => {
    setShowSmtpModal(false)
    setSmtpEmail('')
    setCopiedField(null)
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      showError('ไม่สามารถคัดลอกได้')
    }
  }

  // SMTP Settings data
  const smtpSettings = {
    incoming: {
      protocol: 'IMAP',
      server: process.env.NEXT_PUBLIC_MAIL_HOST || 'mail.pix9.my',
      port: '993',
      security: 'SSL/TLS',
      username: smtpEmail
    },
    outgoing: {
      protocol: 'SMTP',
      server: process.env.NEXT_PUBLIC_MAIL_HOST || 'mail.pix9.my',
      port: '465',
      security: 'SSL/TLS',
      username: smtpEmail
    }
  }

  // Filter emails
  const filteredEmails = emails.filter(item => {
    return item.email.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">อีเมล์ของฉัน</h1>
          <p className="text-slate-400 mt-1">จัดการอีเมล์ทั้งหมดของคุณ</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </button>
          <Link
            href="/emails/create"
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            สร้างอีเมล์
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาอีเมล์..."
            className="input-field pl-12"
          />
        </div>
      </div>

      {/* Email List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-700" />
                <div className="flex-1">
                  <div className="h-5 bg-slate-700 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-slate-700 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredEmails.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmails.map((item, index) => (
            <div 
              key={item.id} 
              className="card hover:border-primary-500/50 transition-all duration-200 animate-fade-in"
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate" title={item.email}>
                    {item.mailName}
                  </h3>
                  <p className="text-sm text-slate-400">@{item.domain}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700/50">
                {/* เปิด Webmail */}
                <button
                  onClick={() => handleOpenWebmail(item.id)}
                  className="flex-1 btn-primary text-sm py-2 flex items-center justify-center gap-2"
                >
                  <Inbox className="w-4 h-4" />
                  Webmail
                </button>
                
                {/* SMTP/IMAP Settings */}
                <button
                  onClick={() => openSmtpModal(item.email)}
                  className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-2"
                  title="ตั้งค่า SMTP/IMAP"
                >
                  <Code2 className="w-4 h-4" />
                  SMTP
                </button>
                
                {/* เปลี่ยนรหัสผ่าน */}
                <button
                  onClick={() => openPasswordModal(item.id, item.email)}
                  className="p-2 rounded-lg bg-slate-700 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 transition-colors"
                  title="เปลี่ยนรหัสผ่าน"
                >
                  <Key className="w-4 h-4" />
                </button>
                
                {/* ลบ */}
                <button
                  onClick={() => handleDelete(item.email)}
                  className="p-2 rounded-lg bg-slate-700 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                  title="ลบอีเมล์"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <Mail className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchTerm ? 'ไม่พบอีเมล์ที่ค้นหา' : 'ยังไม่มีอีเมล์'}
          </h3>
          <p className="text-slate-400 mb-6">
            {searchTerm 
              ? 'ลองค้นหาด้วยคำค้นอื่น'
              : 'เริ่มต้นสร้างอีเมล์แรกของคุณ'
            }
          </p>
          <Link href="/emails/create" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            สร้างอีเมล์ใหม่
          </Link>
        </div>
      )}

      {/* Count */}
      {!loading && filteredEmails.length > 0 && (
        <p className="text-sm text-slate-400 text-center">
          แสดง {filteredEmails.length} จาก {emails.length} อีเมล์
        </p>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closePasswordModal}
          />
          
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {openWebmailAfter ? 'ตั้งรหัสผ่านเพื่อใช้ Webmail' : 'เปลี่ยนรหัสผ่าน'}
                </h3>
                <p className="text-sm text-slate-400 mt-1">{selectedEmailAddress}</p>
              </div>
              <button
                onClick={closePasswordModal}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {openWebmailAfter && (
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-200">
                  💡 อีเมล์นี้สร้างก่อนระบบ Webmail ใหม่ กรุณาตั้งรหัสผ่านครั้งเดียว หลังจากนี้จะเข้าได้เลย
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  รหัสผ่านใหม่
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field pr-12"
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  ยืนยันรหัสผ่านใหม่
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  disabled={changingPassword}
                />
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-red-400 mt-2">รหัสผ่านไม่ตรงกัน</p>
                )}
                {newPassword && confirmPassword && newPassword === confirmPassword && (
                  <p className="text-sm text-green-400 mt-2">✓ รหัสผ่านตรงกัน</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={closePasswordModal}
                className="flex-1 btn-secondary"
                disabled={changingPassword}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                {changingPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    {openWebmailAfter ? 'บันทึกและเปิด Webmail' : 'เปลี่ยนรหัสผ่าน'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMTP Settings Modal */}
      {showSmtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeSmtpModal}
          />
          
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-primary-400" />
                  ตั้งค่า Email Client
                </h3>
                <p className="text-sm text-slate-400 mt-1">{smtpEmail}</p>
              </div>
              <button
                onClick={closeSmtpModal}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Incoming Mail */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-primary-400 uppercase tracking-wide mb-3">
                📥 Incoming Mail (IMAP)
              </h4>
              <div className="space-y-3 bg-slate-900/50 rounded-xl p-4">
                <SettingRow 
                  label="Server" 
                  value={smtpSettings.incoming.server}
                  onCopy={() => copyToClipboard(smtpSettings.incoming.server, 'imap-server')}
                  copied={copiedField === 'imap-server'}
                />
                <SettingRow 
                  label="Port" 
                  value={smtpSettings.incoming.port}
                  onCopy={() => copyToClipboard(smtpSettings.incoming.port, 'imap-port')}
                  copied={copiedField === 'imap-port'}
                />
                <SettingRow 
                  label="Security" 
                  value={smtpSettings.incoming.security}
                  onCopy={() => copyToClipboard(smtpSettings.incoming.security, 'imap-security')}
                  copied={copiedField === 'imap-security'}
                />
                <SettingRow 
                  label="Username" 
                  value={smtpSettings.incoming.username}
                  onCopy={() => copyToClipboard(smtpSettings.incoming.username, 'imap-username')}
                  copied={copiedField === 'imap-username'}
                />
              </div>
            </div>

            {/* Outgoing Mail */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide mb-3">
                📤 Outgoing Mail (SMTP)
              </h4>
              <div className="space-y-3 bg-slate-900/50 rounded-xl p-4">
                <SettingRow 
                  label="Server" 
                  value={smtpSettings.outgoing.server}
                  onCopy={() => copyToClipboard(smtpSettings.outgoing.server, 'smtp-server')}
                  copied={copiedField === 'smtp-server'}
                />
                <SettingRow 
                  label="Port" 
                  value={smtpSettings.outgoing.port}
                  onCopy={() => copyToClipboard(smtpSettings.outgoing.port, 'smtp-port')}
                  copied={copiedField === 'smtp-port'}
                />
                <SettingRow 
                  label="Security" 
                  value={smtpSettings.outgoing.security}
                  onCopy={() => copyToClipboard(smtpSettings.outgoing.security, 'smtp-security')}
                  copied={copiedField === 'smtp-security'}
                />
                <SettingRow 
                  label="Username" 
                  value={smtpSettings.outgoing.username}
                  onCopy={() => copyToClipboard(smtpSettings.outgoing.username, 'smtp-username')}
                  copied={copiedField === 'smtp-username'}
                />
              </div>
            </div>

            {/* Note */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-sm text-amber-200">
                <strong>💡 หมายเหตุ:</strong> Password คือรหัสผ่านของอีเมล์นี้ 
                (รหัสเดียวกับที่ใช้เข้า Webmail)
              </p>
            </div>

            {/* Supported Apps */}
            <div className="mt-6 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-500 text-center">
                ใช้ได้กับ: Outlook, Thunderbird, Apple Mail, Gmail App, และ Email Client อื่นๆ
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Setting Row Component
function SettingRow({ 
  label, 
  value, 
  onCopy, 
  copied 
}: { 
  label: string
  value: string
  onCopy: () => void
  copied: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <code className="text-sm text-white bg-slate-800 px-2 py-1 rounded">
          {value}
        </code>
        <button
          onClick={onCopy}
          className={`p-1.5 rounded-lg transition-colors ${
            copied 
              ? 'bg-green-500/20 text-green-400' 
              : 'hover:bg-slate-700 text-slate-400 hover:text-white'
          }`}
          title="คัดลอก"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}