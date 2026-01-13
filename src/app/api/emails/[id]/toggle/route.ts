// src/app/api/emails/[id]/toggle/route.ts
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

    const newStatus = !email.isActive

    // Toggle on Plesk
    try {
      await pleskClient.toggleMailAccount(email.emailAddress, newStatus)
    } catch (pleskError: any) {
      return NextResponse.json(
        { success: false, message: pleskError.message || 'ไม่สามารถเปลี่ยนสถานะบน Plesk ได้' },
        { status: 500 }
      )
    }

    // Update database
    await prisma.emailAccount.update({
      where: { id: emailId },
      data: { isActive: newStatus }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: newStatus ? 'ENABLE_EMAIL' : 'DISABLE_EMAIL',
        details: `${newStatus ? 'Enabled' : 'Disabled'} email: ${email.emailAddress}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      message: `${newStatus ? 'เปิด' : 'ปิด'}ใช้งานอีเมล์สำเร็จ`,
      data: { isActive: newStatus }
    })
  } catch (error) {
    console.error('Toggle email error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
