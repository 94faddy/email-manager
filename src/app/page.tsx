// src/app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Mail, Shield, Zap, Globe, Users, Lock, 
  Eye, EyeOff, X, ArrowRight, Check,
  Sparkles, Server, Cloud
} from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [allowRegistration, setAllowRegistration] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Check if already logged in
  useEffect(() => {
    checkAuth()
    checkRegistrationSetting()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      
      if (data.success && data.user) {
        router.push('/dashboard')
      }
    } catch {
      // Not logged in
    } finally {
      setCheckingAuth(false)
    }
  }

  const checkRegistrationSetting = async () => {
    try {
      const res = await fetch('/api/settings/system?key=allow_registration')
      const data = await res.json()
      
      if (data.success) {
        setAllowRegistration(data.data?.allow_registration === 'true')
      }
    } catch {
      // Default to false
    }
  }

  const features = [
    {
      icon: Mail,
      title: 'สร้างอีเมล์ง่ายๆ',
      description: 'สร้างอีเมล์ @yourdomain.com ได้ในไม่กี่คลิก พร้อมใช้งานทันที'
    },
    {
      icon: Globe,
      title: 'รองรับหลายโดเมน',
      description: 'จัดการอีเมล์จากหลายโดเมนในที่เดียว เลือกได้ตามต้องการ'
    },
    {
      icon: Shield,
      title: 'Webmail ในตัว',
      description: 'อ่าน-ส่งอีเมล์ได้ทันทีผ่าน Webmail โดยไม่ต้องตั้งค่าเพิ่ม'
    },
    {
      icon: Zap,
      title: 'รวดเร็วทันใจ',
      description: 'ระบบทำงานเร็ว สร้างอีเมล์เสร็จใช้งานได้ทันที ไม่ต้องรอนาน'
    },
    {
      icon: Users,
      title: 'ใช้งานง่าย',
      description: 'อินเทอร์เฟซเรียบง่าย ใช้งานได้สะดวก ไม่ซับซ้อน'
    },
    {
      icon: Lock,
      title: 'ปลอดภัย',
      description: 'รหัสผ่านเข้ารหัส รองรับ HTTPS ปกป้องข้อมูลของคุณ'
    }
  ]

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white">Email Manager</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                เข้าสู่ระบบ
              </button>
              {allowRegistration && (
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
                >
                  สมัครสมาชิก
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Video Background */}
      <section className="relative pt-24 pb-16 px-4 h-[70vh] min-h-[500px] flex items-center overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{ minWidth: '100%', minHeight: '100%' }}
        >
          <source src="/videos/footage.mp4" type="video/mp4" />
        </video>
        
        {/* Overlay */}
        <div className="absolute inset-0 z-[1] bg-slate-900/60" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto text-center w-full">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-sm mb-8">
            <Sparkles className="w-4 h-4" />
            ระบบจัดการอีเมล์อัจฉริยะ
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            จัดการอีเมล์ของคุณ
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-cyan-400">
              ง่าย รวดเร็ว ปลอดภัย
            </span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            สร้างและจัดการอีเมล์ @yourdomain.com ได้ทันที 
            พร้อม Webmail ในตัว รองรับหลายโดเมน ใช้งานง่าย
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white text-lg font-medium rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 flex items-center justify-center gap-2"
            >
              เริ่มต้นใช้งาน
              <ArrowRight className="w-5 h-5" />
            </button>
            {allowRegistration && (
              <button
                onClick={() => setShowRegisterModal(true)}
                className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white text-lg font-medium rounded-xl transition-all border border-slate-700"
              >
                สมัครสมาชิกฟรี
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              ฟีเจอร์หลัก
            </h2>
            <p className="text-slate-400 text-lg">
              ทุกสิ่งที่คุณต้องการสำหรับจัดการอีเมล์
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:border-primary-500/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              วิธีใช้งาน
            </h2>
            <p className="text-slate-400 text-lg">
              3 ขั้นตอนง่ายๆ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-400">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">สมัครสมาชิก</h3>
              <p className="text-slate-400">ลงทะเบียนเพื่อเข้าใช้งานระบบ</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-400">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">สร้างอีเมล์</h3>
              <p className="text-slate-400">เลือกโดเมนและตั้งชื่ออีเมล์ที่ต้องการ</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-400">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">ใช้งานทันที</h3>
              <p className="text-slate-400">เข้า Webmail อ่าน-ส่งอีเมล์ได้เลย</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-slate-800/50 to-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            พร้อมใช้งานแล้ว?
          </h2>
          <p className="text-xl text-slate-400 mb-8">
            เริ่มต้นจัดการอีเมล์ของคุณวันนี้
          </p>
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white text-lg font-medium rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40"
          >
            เข้าสู่ระบบ
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} Email Manager. All rights reserved.
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal 
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={() => {
            setShowLoginModal(false)
            setShowRegisterModal(true)
          }}
          allowRegistration={allowRegistration}
        />
      )}

      {/* Register Modal */}
      {showRegisterModal && allowRegistration && (
        <RegisterModal 
          onClose={() => setShowRegisterModal(false)}
          onSwitchToLogin={() => {
            setShowRegisterModal(false)
            setShowLoginModal(true)
          }}
        />
      )}
    </div>
  )
}

// Login Modal Component
function LoginModal({ 
  onClose, 
  onSwitchToRegister,
  allowRegistration 
}: { 
  onClose: () => void
  onSwitchToRegister: () => void
  allowRegistration: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.username || !formData.password) {
      setError('กรุณากรอกข้อมูลให้ครบ')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        router.push('/dashboard')
      } else {
        setError(data.message || 'เข้าสู่ระบบไม่สำเร็จ')
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">เข้าสู่ระบบ</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              ชื่อผู้ใช้
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-primary-500"
              placeholder="username"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              รหัสผ่าน
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-primary-500 pr-12"
                placeholder="••••••••"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                เข้าสู่ระบบ
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {allowRegistration && (
            <p className="text-center text-slate-400 text-sm">
              ยังไม่มีบัญชี?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-primary-400 hover:text-primary-300"
              >
                สมัครสมาชิก
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

// Register Modal Component
function RegisterModal({ 
  onClose, 
  onSwitchToLogin 
}: { 
  onClose: () => void
  onSwitchToLogin: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.username || !formData.password) {
      setError('กรุณากรอกข้อมูลให้ครบ')
      return
    }

    if (formData.password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password
        })
      })

      const data = await res.json()

      if (data.success) {
        router.push('/dashboard')
      } else {
        setError(data.message || 'สมัครสมาชิกไม่สำเร็จ')
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">สมัครสมาชิก</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              ชื่อผู้ใช้ <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-primary-500"
              placeholder="username"
              disabled={loading}
            />
            <p className="text-xs text-slate-500 mt-1">ใช้ได้ a-z, 0-9, _ (3-20 ตัวอักษร)</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                ชื่อ
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-primary-500"
                placeholder="ชื่อ"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                นามสกุล
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-primary-500"
                placeholder="นามสกุล"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              รหัสผ่าน <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-primary-500 pr-12"
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

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              ยืนยันรหัสผ่าน <span className="text-red-400">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-primary-500"
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              disabled={loading}
            />
            {formData.password && formData.confirmPassword && (
              <p className={`text-xs mt-1 ${formData.password === formData.confirmPassword ? 'text-green-400' : 'text-red-400'}`}>
                {formData.password === formData.confirmPassword ? '✓ รหัสผ่านตรงกัน' : '✗ รหัสผ่านไม่ตรงกัน'}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || formData.password !== formData.confirmPassword}
            className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                สมัครสมาชิก
                <Check className="w-5 h-5" />
              </>
            )}
          </button>

          <p className="text-center text-slate-400 text-sm">
            มีบัญชีอยู่แล้ว?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-primary-400 hover:text-primary-300"
            >
              เข้าสู่ระบบ
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}