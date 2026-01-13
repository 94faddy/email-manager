// src/components/EmailCard.tsx
'use client'

import { Mail, Trash2, Key, ExternalLink, MoreVertical, Power, Calendar, HardDrive } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { showDeleteConfirm, showInput, showSuccess, showError, showLoading, closeLoading } from '@/lib/swal'
import clsx from 'clsx'

interface EmailCardProps {
  email: {
    id: number
    emailAddress: string
    mailName: string
    websiteId: number
    hasMailbox: boolean
    quotaMb: number
    isActive: boolean
    description: string | null
    createdAt: string
    website?: {
      domainName: string
    }
  }
  canDelete?: boolean
  onDelete?: () => void
  onUpdate?: () => void
}

export default function EmailCard({ email, canDelete = false, onDelete, onUpdate }: EmailCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  const webmailUrl = process.env.NEXT_PUBLIC_WEBMAIL_URL || '#'

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDelete = async () => {
    const result = await showDeleteConfirm(email.emailAddress, 'อีเมล์และข้อมูลทั้งหมดจะถูกลบอย่างถาวร')
    
    if (result.isConfirmed) {
      setLoading(true)
      showLoading('กำลังลบอีเมล์...')
      
      try {
        const res = await fetch(`/api/emails/${email.id}`, { method: 'DELETE' })
        const data = await res.json()
        
        closeLoading()
        
        if (res.ok) {
          showSuccess('ลบอีเมล์สำเร็จ')
          onDelete?.()
        } else {
          showError(data.message || 'ไม่สามารถลบอีเมล์ได้')
        }
      } catch {
        closeLoading()
        showError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
      } finally {
        setLoading(false)
        setShowMenu(false)
      }
    }
  }

  const handleChangePassword = async () => {
    const newPassword = await showInput('เปลี่ยนรหัสผ่าน', 'กรอกรหัสผ่านใหม่', 'password')
    
    if (newPassword) {
      if (newPassword.length < 8) {
        showError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
        return
      }
      
      setLoading(true)
      showLoading('กำลังเปลี่ยนรหัสผ่าน...')
      
      try {
        const res = await fetch(`/api/emails/${email.id}/password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: newPassword })
        })
        const data = await res.json()
        
        closeLoading()
        
        if (res.ok) {
          showSuccess('เปลี่ยนรหัสผ่านสำเร็จ')
        } else {
          showError(data.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้')
        }
      } catch {
        closeLoading()
        showError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
      } finally {
        setLoading(false)
        setShowMenu(false)
      }
    }
  }

  const handleToggleStatus = async () => {
    setLoading(true)
    showLoading(`กำลัง${email.isActive ? 'ปิด' : 'เปิด'}ใช้งานอีเมล์...`)
    
    try {
      const res = await fetch(`/api/emails/${email.id}/toggle`, { method: 'PUT' })
      const data = await res.json()
      
      closeLoading()
      
      if (res.ok) {
        showSuccess(`${email.isActive ? 'ปิด' : 'เปิด'}ใช้งานอีเมล์สำเร็จ`)
        onUpdate?.()
      } else {
        showError(data.message || 'ไม่สามารถเปลี่ยนสถานะได้')
      }
    } catch {
      closeLoading()
      showError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      setLoading(false)
      setShowMenu(false)
    }
  }

  const formattedDate = new Date(email.createdAt).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  return (
    <div className={clsx(
      'card card-hover relative group',
      !email.isActive && 'opacity-60'
    )}>
      {/* Status indicator */}
      <div className={clsx(
        'absolute top-4 right-4 w-3 h-3 rounded-full',
        email.isActive ? 'bg-emerald-500' : 'bg-slate-500'
      )} />

      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
          <Mail className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0 pr-8">
          <h3 className="text-lg font-semibold text-white truncate">
            {email.emailAddress}
          </h3>
          <p className="text-sm text-slate-400">
            {email.website?.domainName || 'Unknown domain'}
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-2 mb-4">
        {email.description && (
          <p className="text-sm text-slate-300">{email.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5" />
            {email.quotaMb} MB
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        <a
          href={`${webmailUrl}?_user=${encodeURIComponent(email.emailAddress)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          เปิด Webmail
        </a>

        {/* Dropdown Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 bottom-full mb-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 overflow-hidden animate-fade-in">
              <button
                onClick={handleChangePassword}
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Key className="w-4 h-4" />
                เปลี่ยนรหัสผ่าน
              </button>
              <button
                onClick={handleToggleStatus}
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Power className="w-4 h-4" />
                {email.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
              </button>
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  ลบอีเมล์
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
