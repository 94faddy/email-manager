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

    const { fullName, email } = await request.json()

    // Check if email already exists (excluding current user)
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: user.userId }
        }
      })

      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'อีเมล์นี้ถูกใช้งานแล้ว' },
          { status: 400 }
        )
      }
    }

    await prisma.user.update({
      where: { id: user.userId },
      data: {
        fullName: fullName || null,
        email: email
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
