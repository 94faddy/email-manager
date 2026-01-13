// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// PUT - Update user
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
    const { email, fullName, password, role, isActive } = await request.json()

    // Check if email already exists (excluding current user)
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: parseInt(id) }
        }
      })

      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'อีเมล์นี้ถูกใช้งานแล้ว' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      email,
      fullName: fullName || null,
      role,
      isActive
    }

    // Only update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'แก้ไขผู้ใช้สำเร็จ',
      data: updatedUser
    })

  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}

// DELETE - Delete user
export async function DELETE(
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

    // Prevent self-deletion
    if (parseInt(id) === user.userId) {
      return NextResponse.json(
        { success: false, message: 'ไม่สามารถลบตัวเองได้' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({
      success: true,
      message: 'ลบผู้ใช้สำเร็จ'
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
