// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Email Manager - จัดการอีเมล์ผ่าน Plesk',
  description: 'ระบบจัดการอีเมล์แบบครบวงจร เชื่อมต่อกับ Plesk API',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className="antialiased gradient-bg min-h-screen">
        {children}
      </body>
    </html>
  )
}
