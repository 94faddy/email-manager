// src/components/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Mail, 
  Users, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  MailPlus
} from 'lucide-react'
import { useState } from 'react'
import { showConfirm, showSuccess } from '@/lib/swal'
import clsx from 'clsx'

interface SidebarProps {
  user?: {
    username: string
    role: 'ADMIN' | 'USER'
  } | null
}

const menuItems = [
  { 
    href: '/dashboard', 
    icon: LayoutDashboard, 
    label: 'แดชบอร์ด',
    roles: ['ADMIN', 'USER']
  },
  { 
    href: '/emails', 
    icon: Mail, 
    label: 'อีเมล์ของฉัน',
    roles: ['ADMIN', 'USER']
  },
  { 
    href: '/emails/create', 
    icon: MailPlus, 
    label: 'สร้างอีเมล์',
    roles: ['ADMIN', 'USER']
  },
  { 
    href: '/users', 
    icon: Users, 
    label: 'ผู้ใช้งาน',
    roles: ['ADMIN']
  },
  { 
    href: '/settings', 
    icon: Settings, 
    label: 'ตั้งค่า',
    roles: ['ADMIN', 'USER']
  },
]

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    const result = await showConfirm('ต้องการออกจากระบบหรือไม่?', 'ยืนยันการออกจากระบบ')
    
    if (result.isConfirmed) {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (res.ok) {
        showSuccess('ออกจากระบบสำเร็จ')
        router.push('/')
      }
    }
  }

  const userRole = user?.role || 'USER'
  const filteredMenu = menuItems.filter(item => 
    item.roles.includes(userRole)
  )

  return (
    <aside 
      className={clsx(
        'fixed left-0 top-0 h-screen bg-slate-900/95 backdrop-blur-sm border-r border-slate-700/50 z-50 transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700/50">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-white">Email Manager</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* User Info */}
      <div className={clsx(
        'px-4 py-4 border-b border-slate-700/50',
        collapsed && 'px-2'
      )}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">
              {user?.username?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-white font-medium truncate">{user?.username || 'Guest'}</p>
              <p className="text-xs text-slate-400">
                {user?.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {filteredMenu.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && item.href !== '/emails' && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
                isActive 
                  ? 'bg-primary-600 text-white shadow-glow' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="px-3 py-4 border-t border-slate-700/50">
        <button
          onClick={handleLogout}
          className={clsx(
            'flex items-center gap-3 w-full px-3 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">ออกจากระบบ</span>}
        </button>
      </div>
    </aside>
  )
}