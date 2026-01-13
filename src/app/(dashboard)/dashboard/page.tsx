// src/app/(dashboard)/dashboard/page.tsx
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Mail, Users, Activity, Plus } from 'lucide-react'
import Link from 'next/link'

async function getDashboardStats(userId: number, role: string) {
  const isAdmin = role === 'ADMIN'
  
  const [totalEmails, recentEmails] = await Promise.all([
    prisma.emailAccount.count({
      where: isAdmin ? {} : { userId }
    }),
    prisma.emailAccount.findMany({
      where: isAdmin ? {} : { userId },
      include: {
        website: {
          select: { domainName: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ])

  return { totalEmails, recentEmails }
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    return null
  }

  const stats = await getDashboardStats(user.userId, user.role)

  const statCards = [
    {
      title: 'อีเมล์ทั้งหมด',
      value: stats.totalEmails,
      icon: Mail,
      color: 'from-primary-500 to-primary-700',
      href: '/emails'
    }
  ]

  if (user.role === 'ADMIN') {
    const totalUsers = await prisma.user.count()
    statCards.push({
      title: 'ผู้ใช้งาน',
      value: totalUsers,
      icon: Users,
      color: 'from-orange-500 to-amber-600',
      href: '/users'
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">แดชบอร์ด</h1>
          <p className="text-slate-400 mt-1">
            สวัสดี, {user.username}! ยินดีต้อนรับกลับมา
          </p>
        </div>
        <Link
          href="/emails/create"
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          สร้างอีเมล์ใหม่
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="card card-hover animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">{stat.title}</p>
                <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
              </div>
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-7 h-7 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Emails */}
      <div className="card animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-400" />
            อีเมล์ล่าสุด
          </h2>
          <Link href="/emails" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
            ดูทั้งหมด →
          </Link>
        </div>

        {stats.recentEmails.length > 0 ? (
          <div className="space-y-3">
            {stats.recentEmails.map((email) => (
              <div
                key={email.id}
                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{email.emailAddress}</p>
                    <p className="text-sm text-slate-400">{email.website?.domainName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    email.isActive 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {email.isActive ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(email.createdAt).toLocaleDateString('th-TH')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>ยังไม่มีอีเมล์</p>
            <Link href="/emails/create" className="text-primary-400 hover:text-primary-300 text-sm mt-2 inline-block">
              สร้างอีเมล์ใหม่ →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}