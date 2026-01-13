// src/app/(dashboard)/users/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Users, Search, Plus, Edit, Trash2, Shield, User, X, Eye, EyeOff, Check, Mail } from 'lucide-react'
import { showLoading, closeLoading, showError, showSuccess, showConfirm } from '@/lib/swal'

interface UserItem {
  id: number
  username: string
  email: string
  fullName: string | null
  role: 'ADMIN' | 'USER'
  isActive: boolean
  createdAt: string
  _count?: {
    emailAccounts: number
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    role: 'USER' as 'ADMIN' | 'USER',
    isActive: true
  })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/users')
      const data = await res.json()
      
      if (data.success) {
        setUsers(data.data || [])
      } else {
        showError(data.message || 'ไม่สามารถโหลดข้อมูลได้')
      }
    } catch {
      showError('ไม่สามารถเชื่อมต่อได้')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingUser(null)
    setFormData({
      username: '',
      email: '',
      fullName: '',
      password: '',
      role: 'USER',
      isActive: true
    })
    setShowModal(true)
  }

  const openEditModal = (user: UserItem) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      fullName: user.fullName || '',
      password: '',
      role: user.role,
      isActive: user.isActive
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setFormData({
      username: '',
      email: '',
      fullName: '',
      password: '',
      role: 'USER',
      isActive: true
    })
  }

  const handleSubmit = async () => {
    if (!formData.username || !formData.email) {
      showError('กรุณากรอกข้อมูลให้ครบ')
      return
    }

    if (!editingUser && !formData.password) {
      showError('กรุณากรอกรหัสผ่าน')
      return
    }

    setSaving(true)
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()

      if (data.success) {
        showSuccess(editingUser ? 'แก้ไขสำเร็จ' : 'สร้างผู้ใช้สำเร็จ')
        closeModal()
        fetchUsers()
      } else {
        showError(data.message || 'เกิดข้อผิดพลาด')
      }
    } catch {
      showError('เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (user: UserItem) => {
    const action = user.isActive ? 'ระงับ' : 'เปิดใช้งาน'
    const result = await showConfirm(
      `ต้องการ${action}ผู้ใช้ ${user.username} หรือไม่?`,
      user.isActive ? 'ผู้ใช้จะไม่สามารถเข้าสู่ระบบได้' : 'ผู้ใช้จะสามารถเข้าสู่ระบบได้อีกครั้ง'
    )

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/users/${user.id}/toggle`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: !user.isActive })
        })
        const data = await res.json()

        if (data.success) {
          showSuccess(`${action}สำเร็จ`)
          fetchUsers()
        } else {
          showError(data.message || 'ไม่สามารถเปลี่ยนสถานะได้')
        }
      } catch {
        showError('เกิดข้อผิดพลาด')
      }
    }
  }

  const handleDelete = async (user: UserItem) => {
    const result = await showConfirm(
      `ต้องการลบผู้ใช้ ${user.username} หรือไม่?`,
      'ข้อมูลทั้งหมดของผู้ใช้จะถูกลบ รวมถึงอีเมล์ที่สร้างไว้'
    )

    if (result.isConfirmed) {
      showLoading('กำลังลบ...')
      try {
        const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
        const data = await res.json()
        closeLoading()

        if (data.success) {
          showSuccess('ลบผู้ใช้สำเร็จ')
          fetchUsers()
        } else {
          showError(data.message || 'ไม่สามารถลบได้')
        }
      } catch {
        closeLoading()
        showError('เกิดข้อผิดพลาด')
      }
    }
  }

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-orange-400" />
            จัดการผู้ใช้งาน
          </h1>
          <p className="text-slate-400 mt-1">จัดการบัญชีผู้ใช้งานในระบบ</p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          เพิ่มผู้ใช้
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาผู้ใช้..."
            className="input-field pl-12"
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="card animate-pulse">
          <div className="h-64 bg-slate-700 rounded" />
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4 text-slate-400 font-medium">ผู้ใช้</th>
                  <th className="text-left p-4 text-slate-400 font-medium">อีเมล์</th>
                  <th className="text-left p-4 text-slate-400 font-medium">บทบาท</th>
                  <th className="text-left p-4 text-slate-400 font-medium">อีเมล์ที่สร้าง</th>
                  <th className="text-left p-4 text-slate-400 font-medium">สถานะ</th>
                  <th className="text-right p-4 text-slate-400 font-medium">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          user.role === 'ADMIN' 
                            ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                            : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        }`}>
                          {user.role === 'ADMIN' ? (
                            <Shield className="w-5 h-5 text-white" />
                          ) : (
                            <User className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.username}</p>
                          {user.fullName && (
                            <p className="text-sm text-slate-400">{user.fullName}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">{user.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'ADMIN'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {user.role === 'ADMIN' ? 'ผู้ดูแล' : 'ผู้ใช้'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Mail className="w-4 h-4 text-slate-500" />
                        {user._count?.emailAccounts || 0}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.isActive
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {user.isActive ? 'ใช้งาน' : 'ระงับ'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 rounded-lg bg-slate-700 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors"
                          title="แก้ไข"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.isActive
                              ? 'bg-slate-700 hover:bg-orange-500/20 text-slate-400 hover:text-orange-400'
                              : 'bg-slate-700 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400'
                          }`}
                          title={user.isActive ? 'ระงับ' : 'เปิดใช้งาน'}
                        >
                          {user.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-2 rounded-lg bg-slate-700 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card text-center py-16">
          <Users className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchTerm ? 'ไม่พบผู้ใช้ที่ค้นหา' : 'ยังไม่มีผู้ใช้'}
          </h3>
          <p className="text-slate-400 mb-6">
            {searchTerm ? 'ลองค้นหาด้วยคำค้นอื่น' : 'เริ่มต้นเพิ่มผู้ใช้งานคนแรก'}
          </p>
          <button onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            เพิ่มผู้ใช้
          </button>
        </div>
      )}

      {/* Count */}
      {!loading && filteredUsers.length > 0 && (
        <p className="text-sm text-slate-400 text-center">
          แสดง {filteredUsers.length} จาก {users.length} ผู้ใช้
        </p>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">ชื่อผู้ใช้ *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input-field"
                  placeholder="username"
                  disabled={!!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">อีเมล์ *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="input-field"
                  placeholder="ชื่อ นามสกุล"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  รหัสผ่าน {!editingUser && '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-field pr-12"
                    placeholder={editingUser ? 'เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน' : 'รหัสผ่าน'}
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
                <label className="block text-sm font-medium text-slate-300 mb-2">บทบาท</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'USER' })}
                  className="input-field"
                >
                  <option value="USER">ผู้ใช้งาน</option>
                  <option value="ADMIN">ผู้ดูแลระบบ</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="text-sm text-slate-300">
                  เปิดใช้งาน
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 btn-secondary" disabled={saving}>
                ยกเลิก
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : editingUser ? (
                  <Edit className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {editingUser ? 'บันทึก' : 'สร้าง'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
