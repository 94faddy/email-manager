// src/app/api/webmail/auto-login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { decryptPassword } from '@/lib/crypto'
import { testCredentials } from '@/lib/mail-client'
import { createWebmailSession } from '@/lib/webmail-session'

// POST - Auto login to webmail using stored password
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    const { emailId } = await request.json()

    if (!emailId) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุอีเมล์' },
        { status: 400 }
      )
    }

    // ดึงข้อมูลอีเมล์
    const emailAccount = await prisma.emailAccount.findUnique({
      where: { id: emailId }
    })

    if (!emailAccount) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบอีเมล์นี้' },
        { status: 404 }
      )
    }

    // ตรวจสอบสิทธิ์
    if (user.role !== 'ADMIN' && emailAccount.userId !== user.userId) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึงอีเมล์นี้' },
        { status: 403 }
      )
    }

    // ตรวจสอบว่ามี password เก็บไว้หรือไม่
    if (!emailAccount.encryptedPassword) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบรหัสผ่านของอีเมล์นี้ กรุณาอัปเดตรหัสผ่าน', needPassword: true },
        { status: 400 }
      )
    }

    // Decrypt password
    let password: string
    try {
      password = decryptPassword(emailAccount.encryptedPassword)
    } catch {
      return NextResponse.json(
        { success: false, message: 'ไม่สามารถถอดรหัสผ่านได้ กรุณาอัปเดตรหัสผ่าน', needPassword: true },
        { status: 400 }
      )
    }

    // Test connection
    const isValid = await testCredentials({ 
      email: emailAccount.emailAddress, 
      password 
    })

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'รหัสผ่านไม่ถูกต้อง กรุณาอัปเดตรหัสผ่าน', needPassword: true },
        { status: 401 }
      )
    }

    // Create session
    const token = await createWebmailSession(emailAccount.emailAddress, password)

    // Set cookie
    cookies().set('webmail_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      data: { email: emailAccount.emailAddress }
    })

  } catch (error: any) {
    console.error('Auto login error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}