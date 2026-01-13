// src/app/api/settings/system/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

// GET - ดึงค่า system settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    // ถ้าระบุ key เฉพาะ
    if (key) {
      const setting = await prisma.systemSettings.findUnique({
        where: { key }
      })

      return NextResponse.json({
        success: true,
        data: setting ? { [key]: setting.value } : { [key]: null }
      })
    }

    // ดึงทั้งหมด (เฉพาะ ADMIN)
    const auth = await verifyAuth()
    
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      )
    }

    const settings = await prisma.systemSettings.findMany()
    
    const settingsObj: Record<string, string> = {}
    settings.forEach(s => {
      settingsObj[s.key] = s.value
    })

    return NextResponse.json({
      success: true,
      data: settingsObj
    })

  } catch (error: any) {
    console.error('Get system settings error:', error)
    return NextResponse.json(
      { success: false, message: 'ไม่สามารถดึงข้อมูลได้' },
      { status: 500 }
    )
  }
}

// PUT - อัปเดต system settings (เฉพาะ ADMIN)
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth()
    
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    if (auth.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุ key' },
        { status: 400 }
      )
    }

    // Upsert setting
    await prisma.systemSettings.upsert({
      where: { key },
      create: { key, value: String(value) },
      update: { value: String(value) }
    })

    return NextResponse.json({
      success: true,
      message: 'บันทึกสำเร็จ'
    })

  } catch (error: any) {
    console.error('Update system settings error:', error)
    return NextResponse.json(
      { success: false, message: 'ไม่สามารถบันทึกได้' },
      { status: 500 }
    )
  }
}