// src/app/api/emails/[id]/update-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { encryptPassword } from '@/lib/crypto'
import pleskClient from '@/lib/plesk'

// PUT - Update email password (both Plesk and stored)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const { newPassword } = await request.json()

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' },
        { status: 400 }
      )
    }

    // ดึงข้อมูลอีเมล์
    const emailAccount = await prisma.emailAccount.findUnique({
      where: { id: parseInt(id) }
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
        { success: false, message: 'ไม่มีสิทธิ์' },
        { status: 403 }
      )
    }

    // อัปเดตบน Plesk
    await pleskClient.changeMailPassword(emailAccount.emailAddress, newPassword)

    // Encrypt และเก็บ password ใหม่
    const encryptedPwd = encryptPassword(newPassword)

    await prisma.emailAccount.update({
      where: { id: parseInt(id) },
      data: { encryptedPassword: encryptedPwd }
    })

    return NextResponse.json({
      success: true,
      message: 'อัปเดตรหัสผ่านสำเร็จ'
    })

  } catch (error: any) {
    console.error('Update password error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}