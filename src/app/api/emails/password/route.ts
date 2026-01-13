// src/app/api/emails/password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { pleskClient } from '@/lib/plesk'

// PUT - เปลี่ยนรหัสผ่านอีเมล์
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, newPassword } = body

    if (!email || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุอีเมล์และรหัสผ่านใหม่' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' },
        { status: 400 }
      )
    }

    await pleskClient.changeMailPassword(email, newPassword)

    return NextResponse.json({
      success: true,
      message: 'เปลี่ยนรหัสผ่านสำเร็จ'
    })
  } catch (error: any) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้' },
      { status: 500 }
    )
  }
}