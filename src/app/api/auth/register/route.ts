// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบว่าเปิดให้ลงทะเบียนหรือไม่
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'allow_registration' }
    })

    if (setting?.value !== 'true') {
      return NextResponse.json(
        { success: false, message: 'ระบบปิดรับสมัครสมาชิกใหม่' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { username, password, firstName, lastName } = body

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      )
    }

    // Validate username
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json(
        { success: false, message: 'ชื่อผู้ใช้ต้องเป็น a-z, 0-9, _ และมี 3-20 ตัวอักษร' },
        { status: 400 }
      )
    }

    // Validate password
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' },
        { status: 400 }
      )
    }

    // Check if username exists
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUsername) {
      return NextResponse.json(
        { success: false, message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        role: 'USER',
        isActive: true
      }
    })

    // Create token and set cookie
    const token = await createToken({
      userId: user.id,
      username: user.username,
      role: user.role
    })

    await setAuthCookie(token)

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        details: `สมัครสมาชิกใหม่: ${user.username}`
      }
    })

    return NextResponse.json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ',
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    })

  } catch (error: any) {
    console.error('Register error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' },
      { status: 500 }
    )
  }
}
