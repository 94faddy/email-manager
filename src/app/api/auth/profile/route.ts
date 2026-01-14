// src/app/api/auth/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { firstName, lastName } = await request.json()

    await prisma.user.update({
      where: { id: user.userId },
      data: {
        firstName: firstName || null,
        lastName: lastName || null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'บันทึกข้อมูลสำเร็จ'
    })

  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
