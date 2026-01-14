// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// GET - List all users
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            emailAccounts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: users
    })

  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { username, firstName, lastName, password, role, isActive } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลให้ครบ' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUser = await prisma.user.findFirst({
      where: { username }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        firstName: firstName || null,
        lastName: lastName || null,
        password: hashedPassword,
        role: role || 'USER',
        isActive: isActive !== false
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.userId,
        action: 'CREATE_USER',
        details: `สร้างผู้ใช้ใหม่: ${username}`
      }
    })

    return NextResponse.json({
      success: true,
      message: 'สร้างผู้ใช้สำเร็จ',
      data: newUser
    })

  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
