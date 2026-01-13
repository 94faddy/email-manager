// src/app/(dashboard)/emails/create/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { showSuccess, showError, showLoading, closeLoading } from '@/lib/swal'
import Swal from 'sweetalert2'

export default function CreateEmailPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showDomainDropdown, setShowDomainDropdown] = useState(false)
  
  // Allowed domains from settings
  const [allowedDomains, setAllowedDomains] = useState<string[]>([])
  const [loadingDomains, setLoadingDomains] = useState(true)
  const [selectedDomain, setSelectedDomain] = useState('')
  
  const [formData, setFormData] = useState({
    mailName: '',
    password: '',
    confirmPassword: ''
  })

  useEffect(() => {
    fetchAllowedDomains()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.domain-dropdown')) {
        setShowDomainDropdown(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const fetchAllowedDomains = async () => {
    try {
      const res = await fetch('/api/settings/domains')
      const data = await res.json()
      
      if (data.success && data.data?.length > 0) {
        setAllowedDomains(data.data)
        setSelectedDomain(data.data[0]) // เลือก domain แรกเป็น default
      } else {
        // ถ้าไม่มี allowed domains ให้ใช้ default
        setAllowedDomains(['pix9.my'])
        setSelectedDomain('pix9.my')
      }
    } catch {
      // Fallback
      setAllowedDomains(['pix9.my'])
      setSelectedDomain('pix9.my')
    } finally {
      setLoadingDomains(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // กรองชื่ออีเมล์ให้รับแค่ a-z, 0-9, _, -, .
    if (name === 'mailName') {
      const filtered = value.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase()
      setFormData(prev => ({ ...prev, [name]: filtered }))
      return
    }
    
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectDomain = (domain: string) => {
    setSelectedDomain(domain)
    setShowDomainDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.mailName || !formData.password) {
      showError('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    if (!selectedDomain) {
      showError('กรุณาเลือกโดเมน')
      return
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(formData.mailName)) {
      showError('ชื่ออีเมล์ไม่ถูกต้อง ใช้ได้เฉพาะ a-z, 0-9, ., _, -')
      return
    }

    if (formData.password.length < 8) {
      showError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      showError('รหัสผ่านไม่ตรงกัน')
      return
    }

    setLoading(true)
    showLoading('กำลังสร้างอีเมล์...')

    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mailName: formData.mailName,
          domainName: selectedDomain,
          password: formData.password
        })
      })

      const data = await res.json()
      closeLoading()

      if (res.ok && data.success) {
        const emailAddress = `${formData.mailName}@${selectedDomain}`
        
        // Show success
        await Swal.fire({
          icon: 'success',
          title: 'สร้างอีเมล์สำเร็จ!',
          html: `
            <div class="text-left">
              <p class="mb-2"><strong>อีเมล์:</strong> ${emailAddress}</p>
              <p class="text-sm text-gray-500">คุณสามารถจัดการอีเมล์ได้ที่หน้า "อีเมล์ของฉัน"</p>
            </div>
          `,
          confirmButtonText: 'ตกลง',
          confirmButtonColor: '#10b981',
        })
        
        router.push('/emails')
      } else {
        showError(data.message || 'ไม่สามารถสร้างอีเมล์ได้')
      }
    } catch {
      closeLoading()
      showError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      setLoading(false)
    }
  }

  const emailPreview = formData.mailName && selectedDomain ? `${formData.mailName}@${selectedDomain}` : ''

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link 
          href="/emails" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับ
        </Link>
        <h1 className="text-2xl font-bold text-white">สร้างอีเมล์ใหม่</h1>
        <p className="text-slate-400 mt-1">
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary-400" />
            ข้อมูลอีเมล์
          </h2>

          {/* Mail Name + Domain Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              ชื่ออีเมล์ <span className="text-red-400">*</span>
            </label>
            <div className="flex">
              <input
                type="text"
                name="mailName"
                value={formData.mailName}
                onChange={handleChange}
                className="flex-1 input-field rounded-r-none border-r-0"
                placeholder="username"
                disabled={loading || loadingDomains}
                autoComplete="off"
              />
              {/* Domain Dropdown */}
              <div className="relative domain-dropdown">
                <button
                  type="button"
                  onClick={() => setShowDomainDropdown(!showDomainDropdown)}
                  disabled={loading || loadingDomains || allowedDomains.length <= 1}
                  className={`h-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-r-lg flex items-center gap-2 transition-colors ${
                    allowedDomains.length > 1 
                      ? 'hover:bg-slate-600 cursor-pointer' 
                      : 'cursor-default'
                  }`}
                >
                  {loadingDomains ? (
                    <span className="text-slate-400">กำลังโหลด...</span>
                  ) : (
                    <>
                      <span className="text-slate-300">@{selectedDomain}</span>
                      {allowedDomains.length > 1 && (
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${
                          showDomainDropdown ? 'rotate-180' : ''
                        }`} />
                      )}
                    </>
                  )}
                </button>
                
                {/* Dropdown Menu */}
                {showDomainDropdown && allowedDomains.length > 1 && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                    <div className="max-h-64 overflow-y-auto">
                      {allowedDomains.map((domain) => (
                        <button
                          key={domain}
                          type="button"
                          onClick={() => handleSelectDomain(domain)}
                          className={`w-full px-4 py-3 text-left transition-colors ${
                            domain === selectedDomain
                              ? 'bg-primary-600/20 text-primary-400'
                              : 'text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          @{domain}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">ใช้ได้เฉพาะ a-z, 0-9, จุด (.), ขีดล่าง (_), ขีด (-)</p>
            {emailPreview && (
              <p className="text-sm text-primary-400 mt-1">
                อีเมล์ที่จะสร้าง: <span className="font-mono">{emailPreview}</span>
              </p>
            )}
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              รหัสผ่าน <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field pr-12"
                placeholder="อย่างน้อย 8 ตัวอักษร"
                disabled={loading}
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

          {/* Confirm Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              ยืนยันรหัสผ่าน <span className="text-red-400">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input-field"
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              disabled={loading}
            />
            {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-sm text-red-400 mt-2">รหัสผ่านไม่ตรงกัน</p>
            )}
            {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
              <p className="text-sm text-green-400 mt-2">✓ รหัสผ่านตรงกัน</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/emails" className="btn-secondary">
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={loading || loadingDomains || !formData.mailName || !formData.password || formData.password !== formData.confirmPassword}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                กำลังสร้าง...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                สร้างอีเมล์
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}