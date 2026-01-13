// src/app/api/emails/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { pleskClient } from '@/lib/plesk'

// GET - ดึงข้อมูลอีเมล์
export async function GET(
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
      where: { id: emailId },
      include: {
        website: true,
        user: {
          select: { id: true, username: true }
        }
      }
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
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึงอีเมล์นี้' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: email
    })
  } catch (error) {
    console.error('Get email error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}

// DELETE - ลบอีเมล์
export async function DELETE(
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
    let canDelete = session.role === 'ADMIN'
    
    if (!canDelete && email.userId === session.userId) {
      // Check user website permission (only if websiteId exists)
      if (email.websiteId) {
        const userWebsite = await prisma.userWebsite.findUnique({
          where: {
            userId_websiteId: {
              userId: session.userId,
              websiteId: email.websiteId
            }
          }
        })
        canDelete = userWebsite?.canDelete || false
      } else {
        // No websiteId means user owns this email directly
        canDelete = true
      }
    }

    if (!canDelete) {
      return NextResponse.json(
        { success: false, message: 'คุณไม่มีสิทธิ์ลบอีเมล์นี้' },
        { status: 403 }
      )
    }

    // Delete from Plesk
    try {
      await pleskClient.deleteMailAccount(email.emailAddress)
    } catch (pleskError: any) {
      console.error('Plesk delete error:', pleskError)
      // Continue to delete from DB even if Plesk fails
    }

    // Delete from database
    await prisma.emailAccount.delete({
      where: { id: emailId }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: 'DELETE_EMAIL',
        details: `Deleted email: ${email.emailAddress}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'ลบอีเมล์สำเร็จ'
    })
  } catch (error) {
    console.error('Delete email error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการลบอีเมล์' },
      { status: 500 }
    )
  }
}