// src/app/api/users/[id]/toggle/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const { isActive } = await request.json()

    // Prevent self-toggle
    if (parseInt(id) === user.userId) {
      return NextResponse.json(
        { success: false, message: 'ไม่สามารถเปลี่ยนสถานะตัวเองได้' },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isActive }
    })

    return NextResponse.json({
      success: true,
      message: isActive ? 'เปิดใช้งานสำเร็จ' : 'ระงับการใช้งานสำเร็จ',
      data: updatedUser
    })

  } catch (error) {
    console.error('Toggle user error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
