// src/app/api/emails/[id]/password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { pleskClient } from '@/lib/plesk'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser()
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'ไม่ได้เข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    const { id } = await params
    const emailId = parseInt(id)
    const body = await request.json()
    const { password } = body

    if (!password || password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' },
        { status: 400 }
      )
    }

    const email = await prisma.emailAccount.findUnique({
      where: { id: emailId }
    })

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบอีเมล์นี้' },
        { status: 404 }
      )
    }

    // Check permission
    if (session.role !== 'ADMIN' && email.userId !== session.userId) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์แก้ไขอีเมล์นี้' },
        { status: 403 }
      )
    }

    // Change password on Plesk
    try {
      await pleskClient.changeMailPassword(email.emailAddress, password)
    } catch (pleskError: any) {
      return NextResponse.json(
        { success: false, message: pleskError.message || 'ไม่สามารถเปลี่ยนรหัสผ่านบน Plesk ได้' },
        { status: 500 }
      )
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: 'CHANGE_PASSWORD',
        details: `Changed password for: ${email.emailAddress}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'เปลี่ยนรหัสผ่านสำเร็จ'
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
