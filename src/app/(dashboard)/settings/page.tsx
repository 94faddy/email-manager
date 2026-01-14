// src/app/(dashboard)/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Settings, User, Lock, Globe, Save, Eye, EyeOff, Shield,
  Check, X, RefreshCw, Search, Cog, ToggleLeft, ToggleRight
} from 'lucide-react'
import { showError, showSuccess, showConfirm } from '@/lib/swal'

interface UserProfile {
  id: number
  username: string
  firstName: string | null
  lastName: string | null
  role: string
}

interface PleskDomain {
  id: number
  name: string
  asciiName?: string
  hostingType?: string
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)

  // Domains state (for ADMIN)
  const [pleskDomains, setPleskDomains] = useState<PleskDomain[]>([])
  const [allowedDomains, setAllowedDomains] = useState<string[]>([])
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [loadingDomains, setLoadingDomains] = useState(false)
  const [domainSearch, setDomainSearch] = useState('')

  // System settings state (for ADMIN)
  const [allowRegistration, setAllowRegistration] = useState(false)
  const [loadingSystem, setLoadingSystem] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    if (profile?.role === 'ADMIN' && activeTab === 'domains') {
      fetchPleskDomains()
      fetchAllowedDomains()
    }
    if (profile?.role === 'ADMIN' && activeTab === 'system') {
      fetchSystemSettings()
    }
  }, [profile, activeTab])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      
      if (data.success && data.user) {
        setProfile(data.user)
        setFirstName(data.user.firstName || '')
        setLastName(data.user.lastName || '')
      }
    } catch {
      showError('ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }

  const fetchPleskDomains = async () => {
    setLoadingDomains(true)
    try {
      const res = await fetch('/api/plesk/domains')
      const data = await res.json()
      
      if (data.success) {
        setPleskDomains(data.data || [])
      }
    } catch {
      console.error('Failed to fetch Plesk domains')
    } finally {
      setLoadingDomains(false)
    }
  }

  const fetchAllowedDomains = async () => {
    try {
      const res = await fetch('/api/settings/domains')
      const data = await res.json()
      
      if (data.success) {
        setAllowedDomains(data.data || [])
        setSelectedDomains(data.data || [])
      }
    } catch {
      console.error('Failed to fetch allowed domains')
    }
  }

  const fetchSystemSettings = async () => {
    setLoadingSystem(true)
    try {
      const res = await fetch('/api/settings/system')
      const data = await res.json()
      
      if (data.success && data.data) {
        setAllowRegistration(data.data.allow_registration === 'true')
      }
    } catch {
      console.error('Failed to fetch system settings')
    } finally {
      setLoadingSystem(false)
    }
  }

  const handleUpdateProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName })
      })
      const data = await res.json()

      if (data.success) {
        showSuccess('บันทึกข้อมูลสำเร็จ')
        fetchProfile()
      } else {
        showError(data.message || 'ไม่สามารถบันทึกได้')
      }
    } catch {
      showError('เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword) {
      showError('กรุณากรอกรหัสผ่านปัจจุบัน')
      return
    }
    if (!newPassword || newPassword.length < 8) {
      showError('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร')
      return
    }
    if (newPassword !== confirmPassword) {
      showError('รหัสผ่านใหม่ไม่ตรงกัน')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      const data = await res.json()

      if (data.success) {
        showSuccess('เปลี่ยนรหัสผ่านสำเร็จ')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        showError(data.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้')
      }
    } catch {
      showError('เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const toggleDomain = (domain: string) => {
    setSelectedDomains(prev => 
      prev.includes(domain)
        ? prev.filter(d => d !== domain)
        : [...prev, domain]
    )
  }

  const removeDomain = (domain: string) => {
    setSelectedDomains(prev => prev.filter(d => d !== domain))
  }

  const handleSaveDomains = async () => {
    const result = await showConfirm(
      'บันทึกการตั้งค่าโดเมน?',
      `จะอนุญาตให้สร้างอีเมล์กับ ${selectedDomains.length} โดเมนที่เลือก`
    )

    if (!result.isConfirmed) return

    setSaving(true)
    try {
      const res = await fetch('/api/settings/domains', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains: selectedDomains })
      })
      const data = await res.json()

      if (data.success) {
        showSuccess('บันทึกสำเร็จ')
        setAllowedDomains(selectedDomains)
      } else {
        showError(data.message || 'ไม่สามารถบันทึกได้')
      }
    } catch {
      showError('เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleRegistration = async () => {
    const newValue = !allowRegistration
    const result = await showConfirm(
      newValue ? 'เปิดรับสมัครสมาชิก?' : 'ปิดรับสมัครสมาชิก?',
      newValue ? 'ผู้ใช้ใหม่จะสามารถสมัครสมาชิกได้' : 'ผู้ใช้ใหม่จะไม่สามารถสมัครสมาชิกได้'
    )

    if (!result.isConfirmed) return

    setSaving(true)
    try {
      const res = await fetch('/api/settings/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          key: 'allow_registration', 
          value: newValue ? 'true' : 'false' 
        })
      })
      const data = await res.json()

      if (data.success) {
        setAllowRegistration(newValue)
        showSuccess(newValue ? 'เปิดรับสมัครสมาชิกแล้ว' : 'ปิดรับสมัครสมาชิกแล้ว')
      } else {
        showError(data.message || 'ไม่สามารถบันทึกได้')
      }
    } catch {
      showError('เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  // Filter domains by search
  const filteredDomains = pleskDomains.filter(d => 
    d.name.toLowerCase().includes(domainSearch.toLowerCase())
  )

  const tabs = [
    { id: 'profile', label: 'โปรไฟล์', icon: User },
    { id: 'security', label: 'ความปลอดภัย', icon: Lock },
    // แสดง tab domains และ system เฉพาะ ADMIN
    ...(profile?.role === 'ADMIN' ? [
      { id: 'domains', label: 'โดเมน', icon: Globe },
      { id: 'system', label: 'ระบบ', icon: Cog }
    ] : [])
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-700 rounded w-48 animate-pulse" />
        <div className="card animate-pulse">
          <div className="h-64 bg-slate-700 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Settings className="w-7 h-7 text-primary-400" />
          ตั้งค่า
        </h1>
        <p className="text-slate-400 mt-1">จัดการบัญชีและการตั้งค่าของคุณ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="card p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="card animate-fade-in">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-400" />
                ข้อมูลโปรไฟล์
              </h2>

              <div className="space-y-6">
                {/* Username (readonly) */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    ชื่อผู้ใช้
                  </label>
                  <input
                    type="text"
                    value={profile?.username || ''}
                    disabled
                    className="input-field bg-slate-700/50 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-1">ไม่สามารถเปลี่ยนแปลงได้</p>
                </div>

                {/* First Name & Last Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      ชื่อ
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="input-field"
                      placeholder="กรอกชื่อ"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      นามสกุล
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="input-field"
                      placeholder="กรอกนามสกุล"
                    />
                  </div>
                </div>

                {/* Role (readonly) */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    บทบาท
                  </label>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary-400" />
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      profile?.role === 'ADMIN' 
                        ? 'bg-amber-500/20 text-amber-400' 
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {profile?.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={saving}
                    className="btn-primary flex items-center gap-2"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    บันทึกข้อมูล
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="card animate-fade-in">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary-400" />
                เปลี่ยนรหัสผ่าน
              </h2>

              <div className="space-y-6">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    รหัสผ่านปัจจุบัน
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="input-field pr-12"
                      placeholder="กรอกรหัสผ่านปัจจุบัน"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    รหัสผ่านใหม่
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field"
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    ยืนยันรหัสผ่านใหม่
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field"
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                  />
                  {newPassword && confirmPassword && (
                    <p className={`text-sm mt-2 ${
                      newPassword === confirmPassword ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {newPassword === confirmPassword ? '✓ รหัสผ่านตรงกัน' : '✗ รหัสผ่านไม่ตรงกัน'}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <button
                    onClick={handleChangePassword}
                    disabled={saving || !currentPassword || !newPassword || newPassword !== confirmPassword}
                    className="btn-primary flex items-center gap-2"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    เปลี่ยนรหัสผ่าน
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Domains Tab (ADMIN only) */}
          {activeTab === 'domains' && profile?.role === 'ADMIN' && (
            <div className="card animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary-400" />
                  จัดการโดเมนที่อนุญาต
                </h2>
                <button
                  onClick={fetchPleskDomains}
                  disabled={loadingDomains}
                  className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300"
                  title="รีเฟรช"
                >
                  <RefreshCw className={`w-5 h-5 ${loadingDomains ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <p className="text-sm text-slate-400 mb-4">
                เลือกโดเมนที่ต้องการอนุญาตให้ผู้ใช้สร้างอีเมล์ได้
              </p>

              {/* Selected domains tags */}
              {selectedDomains.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    โดเมนที่เลือก ({selectedDomains.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedDomains.map(domain => (
                      <span
                        key={domain}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-600/20 text-primary-400 rounded-full text-sm"
                      >
                        @{domain}
                        <button
                          onClick={() => removeDomain(domain)}
                          className="hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={domainSearch}
                  onChange={(e) => setDomainSearch(e.target.value)}
                  placeholder="ค้นหาโดเมน..."
                  className="input-field pl-10"
                />
              </div>

              {/* Domains list */}
              <div className="border border-slate-700 rounded-xl overflow-hidden mb-6">
                <div className="max-h-80 overflow-y-auto">
                  {loadingDomains ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                    </div>
                  ) : filteredDomains.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      {domainSearch ? 'ไม่พบโดเมนที่ค้นหา' : 'ไม่พบโดเมนใน Plesk'}
                    </div>
                  ) : (
                    filteredDomains.map((domain, index) => {
                      const isSelected = selectedDomains.includes(domain.name)
                      return (
                        <div
                          key={domain.id}
                          onClick={() => toggleDomain(domain.name)}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                            index !== 0 ? 'border-t border-slate-700/50' : ''
                          } ${isSelected ? 'bg-primary-600/10' : 'hover:bg-slate-800/50'}`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected 
                              ? 'bg-primary-600 border-primary-600' 
                              : 'border-slate-600'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1">
                            <span className={`font-medium ${isSelected ? 'text-primary-400' : 'text-white'}`}>
                              @{domain.name}
                            </span>
                            {domain.hostingType && (
                              <span className="ml-2 text-xs text-slate-500">
                                ({domain.hostingType})
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Save button */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                <p className="text-sm text-slate-500">
                  {selectedDomains.length !== allowedDomains.length || 
                   !selectedDomains.every(d => allowedDomains.includes(d))
                    ? '* มีการเปลี่ยนแปลง'
                    : ''}
                </p>
                <button
                  onClick={handleSaveDomains}
                  disabled={saving || selectedDomains.length === 0}
                  className="btn-primary flex items-center gap-2"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  บันทึก
                </button>
              </div>
            </div>
          )}

          {/* System Tab (ADMIN only) */}
          {activeTab === 'system' && profile?.role === 'ADMIN' && (
            <div className="card animate-fade-in">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Cog className="w-5 h-5 text-primary-400" />
                ตั้งค่าระบบ
              </h2>

              {loadingSystem ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Allow Registration Toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-700">
                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-1">เปิดรับสมัครสมาชิก</h3>
                      <p className="text-sm text-slate-400">
                        อนุญาตให้ผู้ใช้ใหม่สามารถสมัครสมาชิกผ่านหน้าเว็บได้
                      </p>
                    </div>
                    <button
                      onClick={handleToggleRegistration}
                      disabled={saving}
                      className={`p-2 rounded-lg transition-colors ${
                        allowRegistration 
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                          : 'bg-slate-600 text-slate-400 hover:bg-slate-500'
                      }`}
                    >
                      {allowRegistration ? (
                        <ToggleRight className="w-8 h-8" />
                      ) : (
                        <ToggleLeft className="w-8 h-8" />
                      )}
                    </button>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">สถานะ:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      allowRegistration 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {allowRegistration ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <p className="text-sm text-blue-400">
                      💡 เมื่อเปิดรับสมัครสมาชิก ผู้ใช้ใหม่จะสามารถสมัครได้จากหน้าแรกของเว็บไซต์ 
                      โดยจะได้รับสิทธิ์เป็น "ผู้ใช้งาน" (USER) โดยอัตโนมัติ
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}