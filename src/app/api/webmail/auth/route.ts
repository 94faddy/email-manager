// src/app/api/webmail/auth/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { testCredentials } from '@/lib/mail-client'
import { createWebmailSession } from '@/lib/webmail-session'

// POST - Login to webmail
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกอีเมล์และรหัสผ่าน' },
        { status: 400 }
      )
    }

    // Test IMAP connection
    const isValid = await testCredentials({ email, password })

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'อีเมล์หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    // Create session token
    const token = await createWebmailSession(email, password)

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
      data: { email }
    })

  } catch (error: any) {
    console.error('Webmail login error:', error)
    return NextResponse.json(
      { success: false, message: 'ไม่สามารถเชื่อมต่อได้' },
      { status: 500 }
    )
  }
}

// DELETE - Logout
export async function DELETE() {
  cookies().delete('webmail_session')
  
  return NextResponse.json({
    success: true,
    message: 'ออกจากระบบสำเร็จ'
  })
}
